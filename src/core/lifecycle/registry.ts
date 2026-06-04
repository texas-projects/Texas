/**
 * 生命周期注册表 —— @Startup / @Shutdown 装饰器与全局注册表。
 *
 * 业务模块在自身 service 文件末尾使用装饰器声明启动/关闭逻辑，
 * 装饰器在 import 时自动注册到此注册表，由 LifecycleOrchestrator 统一驱动。
 */

/** 描述一个业务模块的启动逻辑。 */
export interface StartupEntry {
  /** 模块唯一标识名，如 "personnel"、"llm"。 */
  name: string
  /** 该模块向注册表提供的服务键名。 */
  provides: readonly string[]
  /** 启动时需要的依赖键名。 */
  requires: readonly string[]
  /** 异步工厂函数：接收 requires dict，返回 provides dict。 */
  fn: (deps: Record<string, unknown>) => Promise<Record<string, unknown>>
}

/** 描述一个业务模块的关闭逻辑。 */
export interface ShutdownEntry {
  /** 对应 StartupEntry 的模块标识名。 */
  name: string
  /** 异步关闭函数：接收本模块 provides 的服务 dict。 */
  fn: (services: Record<string, unknown>) => Promise<void>
}

// ── 全局注册表 ──

const _startups: StartupEntry[] = []
const _shutdowns: ShutdownEntry[] = []

// ── 装饰器工厂 ──

/** 声明业务模块启动逻辑的装饰器。 */
export function Startup(opts: {
  name: string
  provides: string[]
  requires?: string[]
}): (fn: StartupEntry['fn']) => StartupEntry['fn'] {
  return function (fn: StartupEntry['fn']): StartupEntry['fn'] {
    _startups.push({
      name: opts.name,
      provides: opts.provides,
      requires: opts.requires ?? [],
      fn,
    })
    return fn
  }
}

/** 声明业务模块关闭逻辑的装饰器。 */
export function Shutdown(opts: { name: string }): (fn: ShutdownEntry['fn']) => ShutdownEntry['fn'] {
  return function (fn: ShutdownEntry['fn']): ShutdownEntry['fn'] {
    _shutdowns.push({ name: opts.name, fn })
    return fn
  }
}

/** 返回所有已注册的启动入口（副本）。 */
export function getAllStartups(): StartupEntry[] {
  return [..._startups]
}

/** 返回所有已注册的关闭入口（副本）。 */
export function getAllShutdowns(): ShutdownEntry[] {
  return [..._shutdowns]
}

/** 清空全局注册表（仅用于测试）。 */
export function _clearRegistries(): void {
  _startups.length = 0
  _shutdowns.length = 0
}
