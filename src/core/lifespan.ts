/**
 * 应用生命周期 —— 启动与关闭逻辑编排（对标 Python 侧的 lifespan.py）。
 */

import { resolve } from 'node:path'

import { getLogger } from '@logger'
import type { FastifyInstance } from 'fastify'
import type { Redis } from 'ioredis'

import { CacheClient } from './cache/client.js'
import type { Config } from './config.js'
import { createMainDb, createChatDb } from './db/client.js'
import { EventDispatcher } from './framework/dispatcher.js'
import { LoggingInterceptor } from './framework/interceptors/logging.js'
import { SessionInterceptor } from './framework/interceptors/session.js'
import { loadEchoConfig } from './framework/load-echo-config.js'
import { EchoLoader } from './framework/loader.js'
import type { TaskEchoEntry } from './framework/loader.js'
import { CompositeHandlerMapping } from './framework/mapping.js'
import type { HandlerMethod } from './framework/mapping.js'
import type { FeatureChecker } from './framework/ports.js'
import { LifecycleOrchestrator } from './lifecycle/orchestrator.js'
import { getAllStartups, getAllShutdowns } from './lifecycle/registry.js'
// 触发 PersonnelService 的 Startup 注册（EchoLoader 不扫描 src/core/，需手动引入）
import '@/core/personnel/index.js'
import { BotAPI } from './protocol/api.js'
import { handlerRegistry } from './registries/handler.js'
import { ServiceRegistry } from './registries/service-registry.js'
import { createBullMQConnection, getTaskQueue } from './tasks/broker.js'
import { TaskExecutor } from './tasks/executor.js'
import { setTaskDefinitions } from './tasks/scheduler.js'
import { createRedis, checkRedisReachable } from './utils/redis-factory.js'
import { ConnectionManager } from './ws/connection.js'
import { registerWsRoute } from './ws/server.js'

/**
 * 应用生命周期编排。
 *
 * 在 Fastify 的 `onReady` 和 `onClose` 钩子中执行启动/关闭逻辑，
 * 所有服务实例挂载到 `app.state`（通过 `(app as StateApp).state` 访问）。
 *
 * @param app - Fastify 应用实例
 * @param config - 已验证的应用配置
 */
export async function setupLifecycle(app: FastifyInstance, config: Config): Promise<void> {
  // BotAPI 和 ConnectionManager 必须在 onReady 之前创建，以便在 Fastify 启动阶段注册 WS 路由。
  // onReady 触发时插件引导已完成（FST_ERR_ROOT_PLG_BOOTED），此后无法再注册路由。
  const connMgrRef: { current: ConnectionManager | undefined } = { current: undefined }
  const botApi = new BotAPI((data: string) => {
    connMgrRef.current?.send(data)
  })

  const dispatcherRef: { current: EventDispatcher | undefined } = { current: undefined }
  const connMgr = new ConnectionManager(botApi, (event) => {
    void dispatcherRef.current?.dispatch(event, botApi)
  })
  connMgrRef.current = connMgr

  // 注册 WebSocket 路由（必须在 app.listen() 之前完成，即插件引导阶段）
  registerWsRoute(app, connMgr, config.NAPCAT_ACCESS_TOKEN)

  // ── 启动钩子 ──
  app.addHook('onReady', async () => {
    await _startup(app, config, botApi, connMgr, dispatcherRef)
  })

  // ── 关闭钩子 ──
  app.addHook('onClose', async () => {
    await _shutdown(app)
  })
}

// ── 内部状态类型 ──

interface AppState {
  // 基础设施
  mainDb: ReturnType<typeof createMainDb>
  chatDb: ReturnType<typeof createChatDb>
  cacheRedis: Redis
  persistentRedis: Redis
  cacheClient: CacheClient
  persistentClient: CacheClient
  // 框架核心
  botApi: BotAPI
  connMgr: ConnectionManager
  dispatcher: EventDispatcher
  // 任务
  taskExecutor: TaskExecutor
  queue: ReturnType<typeof getTaskQueue>
  // 服务注册表（API 路由通过此访问业务服务）
  serviceRegistry: ServiceRegistry
  // 业务服务（由 orchestrator 填充）
  [key: string]: unknown
}

/** 获取 app.state（类型断言辅助函数）。 */
function getState(app: FastifyInstance): AppState {
  return (app as unknown as { state: AppState }).state
}

// ── 启动逻辑 ──

async function _startup(
  app: FastifyInstance,
  config: Config,
  botApi: BotAPI,
  connMgr: ConnectionManager,
  dispatcherRef: { current: EventDispatcher | undefined },
): Promise<void> {
  app.log.info('Aemeath 正在启动...')

  // 1. 初始化 Prisma 客户端
  const mainDb = createMainDb(config.DATABASE_URL, config.DB_POOL_SIZE)
  const chatDb = createChatDb(config.CHAT_DATABASE_URL, config.CHAT_DB_POOL_SIZE)

  // 2. 初始化 Redis 客户端
  const cacheRedis = createRedis(config.CACHE_REDIS_URL, { lazyConnect: false })
  const persistentRedis = createRedis(config.PERSISTENT_REDIS_URL, {
    lazyConnect: false,
  })

  // 3. 创建 CacheClient 封装
  const cacheClient = new CacheClient(cacheRedis, config.CACHE_DEFAULT_TTL)
  const persistentClient = new CacheClient(persistentRedis, 0)

  // 4. 构建复合处理器映射
  const composite = new CompositeHandlerMapping()

  // 5. EchoLoader 发现并加载 handlers、services、tasks（触发 @Startup/@Shutdown 副作用）
  await _loadEchoes(composite)

  // 6. 构建 Dispatcher 并连接到 connMgr（解决 setupLifecycle 阶段的前向引用）
  const dispatcher = new EventDispatcher(composite, [
    new LoggingInterceptor(),
    new SessionInterceptor(),
  ])
  dispatcherRef.current = dispatcher

  // 8.5. 预检所有 Redis 连接可达性（连接不可用时立即抛出，避免后续操作无声挂起）
  await checkRedisReachable(config.CACHE_REDIS_URL, 'Cache Redis')
  await checkRedisReachable(config.PERSISTENT_REDIS_URL, 'Persistent Redis')
  await checkRedisReachable(config.BULLMQ_REDIS_URL, 'BullMQ Redis')

  // 9. 创建 BullMQ 单队列
  const bullConn = createBullMQConnection(config.BULLMQ_REDIS_URL)
  const queue = getTaskQueue(bullConn)

  // 10. 生命周期编排器：按拓扑顺序启动所有业务模块
  const orchestrator = new LifecycleOrchestrator()
  const infraServices: Record<string, unknown> = {
    db: mainDb,
    chat_db: chatDb,
    cache: cacheClient,
    persistent: persistentClient,
    cache_redis: cacheRedis,
    persistent_redis: persistentRedis,
    bot_api: botApi,
    conn_mgr: connMgr,
    dispatcher,
    queue,
  }

  const allServices = await orchestrator.startup(infraServices, getAllStartups())

  // 10.5. 注入 Settings 权限检查器到 Dispatcher（延迟绑定）
  const settingsChecker = allServices.settings_checker as FeatureChecker | undefined
  if (settingsChecker) {
    dispatcher.setFeatureChecker(settingsChecker)
  }

  // 11. 构建 ServiceRegistry（API 路由通过 app.state.serviceRegistry 访问业务服务）
  const serviceRegistry = new ServiceRegistry()
  for (const [key, value] of Object.entries(allServices)) {
    serviceRegistry.register(key, value)
  }
  serviceRegistry.freeze()

  // 13. 启动 TaskExecutor（监听 job completed 事件）
  const taskExecutor = new TaskExecutor(botApi, connMgr, cacheClient, bullConn)
  taskExecutor.start()

  // 15. 将所有服务挂载到 app.state
  ;(app as unknown as { state: AppState }).state = {
    mainDb,
    chatDb,
    cacheRedis,
    persistentRedis,
    cacheClient,
    persistentClient,
    botApi,
    connMgr,
    dispatcher,
    taskExecutor,
    queue,
    serviceRegistry,
    ...allServices,
  }

  app.log.info(`Aemeath 已启动，等待 NapCat 连接 (host=${config.HOST} port=${String(config.PORT)})`)
}

// ── EchoLoader 辅助函数 ──

/**
 * 通过 EchoLoader 加载 handler、service、task 类型的 echo，
 * 触发装饰器副作用（@Startup/@Shutdown 注册），
 * 并将 task definitions 传给 scheduler，最后将 handler 注册到 composite mapping。
 */
async function _loadEchoes(composite: CompositeHandlerMapping): Promise<void> {
  const echoConfig = await loadEchoConfig()
  const baseDir = resolve(import.meta.dirname, '..', '..')
  const loader = new EchoLoader(echoConfig, baseDir)

  await loader.discoverByType('handler')
  await loader.discoverByType('service')

  const taskEntries = (await loader.discoverByType('task')) as TaskEchoEntry[]
  setTaskDefinitions(taskEntries.map((e) => e.taskDefinition))

  _registerHandlersToMapping(composite)
}

/** 遍历 HandlerRegistry，实例化所有组件并将处理器方法注册到 CompositeHandlerMapping。 */
function _registerHandlersToMapping(composite: CompositeHandlerMapping): void {
  const log = getLogger('lifespan')
  for (const [componentName, entry] of handlerRegistry.entries()) {
    const instance = new (entry.meta.target as new () => object)()
    const defaultPriority = entry.meta.defaultPriority

    let handlerCount = 0
    for (const methodMeta of entry.methods) {
      const priority = methodMeta.priority ?? defaultPriority
      composite.register({
        instance,
        method: methodMeta.method,
        priority,
        componentName,
        meta: methodMeta as unknown as HandlerMethod['meta'],
      })
      handlerCount++
    }

    log.info(`组件已注册：${componentName}，handler 数量：${String(handlerCount)}`)
  }
}

// ── 关闭逻辑 ──

async function _shutdown(app: FastifyInstance): Promise<void> {
  app.log.info('Aemeath 正在关闭...')

  const state = getState(app)

  // 停止 TaskExecutor
  await state.taskExecutor.close()

  // 关闭业务模块（@Shutdown 按启动逆序）
  const orchestrator = new LifecycleOrchestrator()
  try {
    await orchestrator.shutdown(getAllShutdowns())
  } catch (err) {
    app.log.error({ err }, '业务模块关闭时发生错误')
  }

  // 关闭数据库连接
  await state.mainDb.$disconnect()
  await state.chatDb.$disconnect()

  // 关闭 Redis 连接
  state.cacheRedis.disconnect()
  state.persistentRedis.disconnect()

  // 关闭 BullMQ 队列
  await (state.queue as { close(): Promise<void> }).close()

  app.log.info('Aemeath 已停止')
}
