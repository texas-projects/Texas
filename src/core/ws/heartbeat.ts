/**
 * NapCat 连接的心跳监控。
 */

/** 心跳监控器 —— 追踪 NapCat 发出的心跳事件，超时时触发回调。 */
export class HeartbeatMonitor {
  private lastHeartbeatTime = 0
  private intervalHandle: ReturnType<typeof setInterval> | null = null

  /** 记录心跳时间戳。 */
  recordHeartbeat(): void {
    this.lastHeartbeatTime = Date.now()
  }

  /** 判断心跳是否在超时时间内。 */
  isAlive(timeoutMs: number): boolean {
    if (this.lastHeartbeatTime === 0) {
      return true // 尚未收到心跳，视为存活（初始状态）
    }
    return Date.now() - this.lastHeartbeatTime < timeoutMs
  }

  /**
   * 启动监控循环。
   *
   * @param checkIntervalMs - 检查间隔（毫秒）
   * @param timeoutMs - 超时阈值（毫秒）
   * @param onTimeout - 超时时触发的回调
   */
  start(checkIntervalMs: number, timeoutMs: number, onTimeout: () => void): void {
    this.stop()
    this.lastHeartbeatTime = Date.now()
    this.intervalHandle = setInterval(() => {
      if (!this.isAlive(timeoutMs)) {
        onTimeout()
      }
    }, checkIntervalMs)
  }

  /** 停止监控循环。 */
  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }
}
