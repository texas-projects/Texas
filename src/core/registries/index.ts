/**
 * 注册表统一导出入口。
 */

export { cacheKeyRegistry, CacheKeyRegistry } from './cache-key.js'
export type { CacheKeyDefinition } from './cache-key.js'

export { metricRegistry, MetricRegistry } from './metric.js'
export type { HistogramOpts } from './metric.js'

export { handlerRegistry, HandlerRegistry } from './handler.js'
export type { HandlerMeta, MethodMeta, HandlerRegistryEntry } from './handler.js'

export { ServiceRegistry } from './service-registry.js'
