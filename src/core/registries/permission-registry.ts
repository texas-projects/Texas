/**
 * 权限内存快照注册表 —— 从 FeatureRegistry 派生的只读权限规则。
 */

import type { FeatureRegistry } from './feature-registry.js'

/** 单个功能的权限规则快照（只读）。 */
export interface PermissionRule {
  readonly featureName: string
  readonly system: boolean
  readonly defaultEnabled: boolean
  readonly admin: boolean
}

/**
 * 只读权限规则快照，ComponentScanner.scan() 完成后由 FeatureRegistry 派生。
 *
 * 提供零 IO 的内存查询接口，用于热路径权限检查（如 system 功能直通）。
 */
export class PermissionRegistry {
  private readonly _rules: Map<string, PermissionRule>

  constructor(rules: Map<string, PermissionRule>) {
    this._rules = rules
  }

  /** 从 FeatureRegistry 构建权限规则快照。 */
  static fromFeatureRegistry(registry: FeatureRegistry): PermissionRegistry {
    const rules = new Map<string, PermissionRule>()
    for (const info of registry.getAll()) {
      rules.set(info.name, {
        featureName: info.name,
        system: info.system,
        defaultEnabled: info.defaultEnabled,
        admin: info.admin,
      })
    }
    return new PermissionRegistry(rules)
  }

  /** 是否为系统级功能（强制启用，零 IO）。 */
  isSystem(featureName: string): boolean {
    return this._rules.get(featureName)?.system === true
  }

  /** 是否仅管理员可用。 */
  isAdmin(featureName: string): boolean {
    return this._rules.get(featureName)?.admin === true
  }

  /** 获取功能默认启用状态。 */
  getDefault(featureName: string): boolean {
    return this._rules.get(featureName)?.defaultEnabled === true
  }

  /** 检查规则是否存在。 */
  has(featureName: string): boolean {
    return this._rules.has(featureName)
  }
}
