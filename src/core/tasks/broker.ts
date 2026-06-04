/**
 * BullMQ 队列工厂与连接配置 —— 提供 Redis 连接解析和队列实例缓存。
 */

import { Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'

// ── 队列名称常量 ──

/** 所有 BullMQ 队列名称。 */
export const QUEUE_NAMES = {
  DAILY_CHECKIN: 'daily-checkin',
  DAILY_LIKE: 'daily-like',
  CHAT_ARCHIVE: 'chat-archive',
  ENSURE_PARTITIONS: 'ensure-chat-partitions',
} as const

// ── 模块级队列实例缓存 ──

const _queueCache = new Map<string, Queue>()

// ── 工具函数 ──

/**
 * 将 Redis URL 解析为 BullMQ（ioredis）所需的连接选项对象。
 *
 * BullMQ 内部使用 ioredis，不接受 URL 字符串，需要传入 host/port/password/db 对象。
 *
 * @param redisUrl - 形如 redis://[:password@]host[:port][/db] 的 Redis URL
 * @returns ioredis ConnectionOptions 对象
 */
export function createBullMQConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl)

  const host = url.hostname
  const port = url.port ? parseInt(url.port, 10) : 6379
  const password = url.password ? decodeURIComponent(url.password) : undefined
  // pathname 形如 "/0"，取 db 索引
  const dbStr = url.pathname.replace(/^\//, '')
  const db = dbStr !== '' ? parseInt(dbStr, 10) : 0

  const conn: ConnectionOptions = { host, port, db }
  if (password) {
    conn.password = password
  }

  // 支持 rediss:// TLS 连接
  if (url.protocol === 'rediss:') {
    conn.tls = {}
  }

  return conn
}

/**
 * 创建一个新的 BullMQ Queue 实例。
 *
 * @param name - 队列名称（建议使用 QUEUE_NAMES 常量）
 * @param connection - ioredis 连接选项
 * @returns Queue 实例
 */
export function createQueue(name: string, connection: ConnectionOptions): Queue {
  return new Queue(name, { connection })
}

/**
 * 获取（或懒加载创建）指定名称的 Queue 单例。
 *
 * 同一名称+连接在进程生命周期内只创建一个实例，避免重复建立连接。
 *
 * @param name - 队列名称
 * @param connection - ioredis 连接选项（首次调用时使用）
 * @returns 缓存的 Queue 实例
 */
export function getQueue(name: string, connection: ConnectionOptions): Queue {
  const cached = _queueCache.get(name)
  if (cached !== undefined) {
    return cached
  }
  const queue = createQueue(name, connection)
  _queueCache.set(name, queue)
  return queue
}
