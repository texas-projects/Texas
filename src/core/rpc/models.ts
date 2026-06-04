/**
 * Redis RPC 请求/响应模型 —— Worker 与主进程间通信的数据结构。
 */

/** Worker → 主进程的 RPC 请求。 */
export interface RPCRequest {
  /** UUID 字符串，用于匹配对应的响应通道。 */
  request_id: string
  /** action 名称（业务自定义，如 request_checkin）。 */
  action: string
  /** 传递给 action 的参数字典。 */
  params: Record<string, unknown>
  /** 调用方期望的超时秒数，Consumer 侧将以此限制 handler 的最大执行时间。 */
  timeout: number
}

/** 主进程 → Worker 的 RPC 响应。 */
export interface RPCResponse {
  /** 与 RPCRequest.request_id 匹配。 */
  request_id: string
  /** true 表示调用成功，false 表示发生错误。 */
  success: boolean
  /** 成功时为 handler 返回的数据字典。 */
  data?: Record<string, unknown> | null
  /** 失败时的错误描述。 */
  error?: string | null
}
