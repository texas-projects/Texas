/**
 * 日志广播器 —— EventEmitter 单例，供 SSE 日志端点订阅实时日志流。
 */

import { EventEmitter } from 'node:events'

/**
 * 日志广播器。
 *
 * 日志写入器调用 {@link LogBroadcaster.broadcast} 推送日志条目，
 * SSE 端点监听 `'log'` 事件接收并转发给前端。
 */
export class LogBroadcaster extends EventEmitter {
  /**
   * 广播一条日志条目到所有监听器。
   *
   * @param entry - 结构化日志对象（通常为 Pino JSON 格式）
   */
  broadcast(entry: Record<string, unknown>): void {
    this.emit('log', entry)
  }
}

/** 全局日志广播器单例。 */
export const logBroadcaster = new LogBroadcaster()

// 防止因订阅者过多产生 MaxListenersExceededWarning
logBroadcaster.setMaxListeners(100)
