/**
 * OneBot 11 协议的 API 请求/响应模型。
 */

/** 通过 WebSocket 发送的 OneBot 11 API 请求。 */
export interface APIRequest {
  action: string
  params: Record<string, unknown>
  echo: string
}

/** 通过 WebSocket 接收的 OneBot 11 API 响应。 */
export interface APIResponse {
  status: string // ok | failed
  retcode: number
  data: Record<string, unknown> | unknown[] | null
  message?: string | null
  wording?: string | null
  echo: string
  [key: string]: unknown
}

/** 判断 APIResponse 是否成功。 */
export function isApiOk(res: APIResponse): boolean {
  return res.status === 'ok' && res.retcode === 0
}
