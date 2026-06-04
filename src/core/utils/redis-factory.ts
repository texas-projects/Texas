/** ioredis 实例工厂。 */

import IORedis from 'ioredis'
import type { Redis, RedisOptions } from 'ioredis'

/** 创建一个新的 ioredis Redis 实例。 */
export function createRedis(url: string, opts?: RedisOptions): Redis {
  return new IORedis(url, opts)
}
