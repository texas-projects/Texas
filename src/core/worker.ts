/**
 * Aemeath BullMQ Worker 进程入口 —— 通过 EchoLoader 动态发现任务，按 job.name 路由。
 *
 * 启动方式：
 *   node dist/core/worker.js
 *   pnpm worker
 */

import { resolve } from 'node:path'

import { createLogger, setLogger, logger } from '@logger'
import { Worker } from 'bullmq'

import { CacheClient } from './cache/client.js'
import { loadConfig } from './config.js'
import { createMainDb, createChatDb } from './db/client.js'
import { loadEchoConfig } from './framework/load-echo-config.js'
import { EchoLoader } from './framework/loader.js'
import type { TaskEchoEntry } from './framework/loader.js'
import { createBullMQConnection, QUEUE_NAME } from './tasks/broker.js'
import type { TaskDefinition, MinimalSettingSchema } from './tasks/types.js'
import { createRedis } from './utils/redis-factory.js'

// ── 初始化 ──

const config = loadConfig()

// Worker 进程独立初始化 logger
setLogger(createLogger({ level: config.LOG_LEVEL, format: config.LOG_FORMAT }))
const log = logger.child({ name: 'worker' })

// ── 主函数 ──

async function main(): Promise<void> {
  // ── 基础设施初始化 ──

  const bullConn = createBullMQConnection(config.BULLMQ_REDIS_URL)
  const db = createMainDb(config.DATABASE_URL)
  const chatDb = createChatDb(config.CHAT_DATABASE_URL)
  const cacheRedis = createRedis(config.CACHE_REDIS_URL)
  const cache = new CacheClient(cacheRedis)

  const infraDeps: Record<string, unknown> = { db, chat_db: chatDb, cache }

  // ── EchoLoader 动态发现任务 ──

  const echoConfig = await loadEchoConfig()
  const baseDir = resolve(import.meta.dirname, '..', '..')
  const loader = new EchoLoader(echoConfig, baseDir)
  const taskEntries = await loader.discoverByType('task')

  // ── 构建路由表 + 聚合 schemaMap ──

  const processorMap = new Map<string, TaskDefinition>()
  const schemaMap = new Map<string, MinimalSettingSchema>()

  for (const entry of taskEntries) {
    const { taskDefinition: def } = entry as TaskEchoEntry
    processorMap.set(def.jobName, def)
    if (def.settings) {
      for (const [k, v] of Object.entries(def.settings)) {
        schemaMap.set(k, v)
      }
    }
  }

  infraDeps.schemaMap = schemaMap

  log.info({ tasks: [...processorMap.keys()] }, 'Aemeath Worker 正在启动...')

  // ── 单 Worker 实例，按 job.name 路由 ──

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const def = processorMap.get(job.name)
      if (!def) throw new Error(`未知的 job name: ${job.name}`)

      const deps: Record<string, unknown> = Object.fromEntries(
        (def.requires ?? []).map((key) => [key, infraDeps[key]]),
      )
      // schemaMap 始终传入
      deps.schemaMap = infraDeps.schemaMap

      return def.processor(job, deps)
    },
    { connection: bullConn, concurrency: 3 },
  )

  // ── 事件处理 ──

  worker.on('completed', (job) => {
    log.info(`任务完成: job=${job.id ?? ''} name=${job.name}`)
  })

  worker.on('failed', (job, err) => {
    log.error({ err }, `任务失败: job=${job?.id ?? ''} name=${job?.name ?? ''}`)
  })

  worker.on('error', (err) => {
    log.error({ err }, 'Worker 错误')
  })

  log.info(`Aemeath Worker 已启动，监听队列: ${QUEUE_NAME}`)

  // ── 优雅关闭 ──

  async function shutdown(): Promise<void> {
    log.info('收到停止信号，正在优雅关闭...')
    await worker.close()
    await db.$disconnect()
    await chatDb.$disconnect()
    cacheRedis.disconnect()
    log.info('Aemeath Worker 已停止')
    process.exit(0)
  }

  process.on('SIGTERM', () => {
    void shutdown()
  })

  process.on('SIGINT', () => {
    void shutdown()
  })
}

main().catch((err: unknown) => {
  console.error('Worker 启动失败:', err)
  process.exit(1)
})
