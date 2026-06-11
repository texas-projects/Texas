// src/core/registries/cache-key.ts
/** CacheKey 注册表，业务模块通过副作用自注册。 */

export interface CacheKeyDefinition {
  readonly namespace: string
  readonly name: string
  readonly build: (...args: string[]) => string
  readonly ttl?: number
  readonly description?: string
}

export class CacheKeyRegistry {
  private readonly _entries = new Map<string, CacheKeyDefinition>()

  private _key(namespace: string, name: string): string {
    return `${namespace}:${name}`
  }

  register(definition: CacheKeyDefinition): void {
    const key = this._key(definition.namespace, definition.name)
    if (this._entries.has(key)) {
      throw new Error(`CacheKey "${key}" 已注册`)
    }
    this._entries.set(key, definition)
  }

  get(namespace: string, name: string): CacheKeyDefinition | undefined {
    return this._entries.get(this._key(namespace, name))
  }

  buildKey(namespace: string, name: string, ...args: string[]): string {
    const def = this.get(namespace, name)
    if (!def) throw new Error(`CacheKey "${namespace}:${name}" 未注册`)
    return def.build(...args)
  }

  getAll(): readonly CacheKeyDefinition[] {
    return [...this._entries.values()]
  }
}

export const cacheKeyRegistry = new CacheKeyRegistry()
