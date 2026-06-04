/**
 * 框架扩展点接口定义 —— 框架核心与业务层之间的契约。
 */

import type { Context } from './context.js'

/** 统一权限检查（功能级 + 角色级），在 handler 循环中逐 handler 调用。 */
export interface FeatureChecker {
  check(ctx: Context): Promise<boolean>
}
