/**
 * 协议层公共工具函数。
 */

import type { AnyOneBotEvent } from './models/events.js'
import type { MessageSegment } from './models/segments.js'

/** 从消息事件中提取纯文本内容。 */
export function extractPlaintext(event: AnyOneBotEvent): string {
  if (event.post_type !== 'message' && event.post_type !== 'message_sent') {
    return ''
  }
  const msg = (event as { message?: unknown }).message
  if (typeof msg === 'string') {
    return msg.trim()
  }
  if (!Array.isArray(msg)) {
    return ''
  }
  const parts: string[] = []
  for (const seg of msg as MessageSegment[]) {
    if (seg.type === 'text') {
      const text = (seg.data as Record<string, unknown>).text
      if (typeof text === 'string') {
        parts.push(text)
      }
    }
  }
  return parts.join('').trim()
}
