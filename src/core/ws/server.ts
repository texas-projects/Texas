/**
 * NapCat 反向 WebSocket 端点注册 —— Fastify 路由存根。
 */

import '@fastify/websocket'

import type { FastifyInstance, FastifyRequest } from 'fastify'

import type { ConnectionManager, MinimalSocket } from './connection.js'

/**
 * 向 Fastify 实例注册 WebSocket 路由。
 *
 * NapCat 以客户端身份主动连接此端点（反向 WebSocket 模式）。
 * token 校验通过 URL 查询参数或 Authorization 请求头完成。
 *
 * @param app - Fastify 应用实例（需已注册 @fastify/websocket 插件）
 * @param connMgr - 连接管理器实例
 * @param token - 访问令牌（NAPCAT_ACCESS_TOKEN）
 */
export function registerWsRoute(
  app: FastifyInstance,
  connMgr: ConnectionManager,
  token: string,
): void {
  app.get('/ws', { websocket: true }, function (socket: MinimalSocket, req: FastifyRequest) {
    // 令牌鉴权：优先检查 query 参数，其次检查 Authorization 请求头
    const query = req.query as Record<string, string>
    const accessToken = query.access_token ?? ''
    // 从请求头中安全提取 Authorization 字段
    const rawAuthHeader: unknown = (req.raw.headers as Record<string, unknown>).authorization
    const authHeaderStr: string =
      typeof rawAuthHeader === 'string'
        ? rawAuthHeader
        : Array.isArray(rawAuthHeader) && typeof rawAuthHeader[0] === 'string'
          ? rawAuthHeader[0]
          : ''
    const headerToken = authHeaderStr.startsWith('Bearer ') ? authHeaderStr.slice(7) : ''

    if (accessToken !== token && headerToken !== token) {
      socket.close(4001, 'Unauthorized')
      return
    }

    // 一对一架构：拒绝重复连接
    if (connMgr.isConnected) {
      socket.close(4002, 'Already connected')
      return
    }

    connMgr.handleConnect(socket, req.raw)
  })
}
