/**
 * 配置注册表 —— 各模块自持的配置对象动态注册中心。
 */

/**
 * 各业务模块的配置实例注册表。
 *
 * 每个模块在启动时可选注册自己的配置对象，
 * 运维工具可遍历此注册表获取所有有效配置的当前值。
 */
export class ConfigRegistry {
  private readonly _store = new Map<string, Record<string, unknown>>()

  /** 注册配置对象。 */
  register(name: string, config: Record<string, unknown>): void {
    this._store.set(name, config)
  }

  /**
   * 按名称获取配置对象并转换为目标类型。
   * 不存在时抛出 Error。
   *
   * 用法：`registry.getTyped(MyConfig, 'myConfig')`
   */
  getTyped<T extends Record<string, unknown>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _ctor: abstract new (...args: any[]) => T,
    name: string,
  ): T {
    const value = this._store.get(name)
    if (value === undefined) {
      throw new Error(`ConfigRegistry 中不存在配置：${name}`)
    }
    return value as T
  }

  /** 按名称获取配置对象，不存在时返回 undefined。 */
  get(name: string): Record<string, unknown> | undefined {
    return this._store.get(name)
  }

  /** 检查配置是否已注册。 */
  has(name: string): boolean {
    return this._store.has(name)
  }

  /** 返回所有配置对象的聚合（用于运维诊断）。 */
  all(): Record<string, Record<string, unknown>> {
    return Object.fromEntries(this._store)
  }
}
