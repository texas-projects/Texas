/**
 * 不可变功能注册表 —— 启动时构建，运行期间只读。
 */

/** 单个功能的元数据。 */
export interface FeatureInfo {
  /** 功能唯一标识。 */
  name: string
  /** 人类可读名称。 */
  displayName: string
  /** 功能描述。 */
  description: string
  /** 代码定义的默认启用状态。 */
  defaultEnabled: boolean
  /** 是否为系统功能（强制启用，不在前端展示）。 */
  system: boolean
  /** 是否仅管理员可用。 */
  admin: boolean
  /** 消息范围：'all' / 'group' / 'private'。 */
  messageScope: string
  /** Handler 映射类型（command/regex/keyword 等），controller 级为空字符串。 */
  mappingType: string
  /** 标签列表。 */
  tags: readonly string[]
  /** 父 controller 名称，null 表示顶层。 */
  parent: string | null
  /** 子功能 name 列表，仅 controller 级非空。 */
  children: readonly string[]
  /** 用户可感知的触发方式描述。 */
  trigger: string
}

/**
 * 功能注册表。
 *
 * 支持写入（register）和只读查询（getAll、get）。
 * 通常在启动时通过 ComponentScanner 扫描填充，之后只读使用。
 */
export class FeatureRegistry {
  private readonly _data = new Map<string, FeatureInfo>()

  /** 注册（或覆盖）一条功能元数据。 */
  register(info: FeatureInfo): void {
    this._data.set(info.name, info)
  }

  /** 获取所有功能元数据列表。 */
  getAll(): FeatureInfo[] {
    return [...this._data.values()]
  }

  /** 按名称获取功能元数据，不存在时返回 undefined。 */
  get(name: string): FeatureInfo | undefined {
    return this._data.get(name)
  }

  /** 检查功能是否已注册。 */
  has(name: string): boolean {
    return this._data.has(name)
  }

  /** 已注册功能数量。 */
  get size(): number {
    return this._data.size
  }
}
