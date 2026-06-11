// src/core/cache/core-cache-keys.ts
/** 框架级 cache key 自注册（perm + session）。 */
import { cacheKeyRegistry } from '@/core/registries/index.js'

cacheKeyRegistry.register({
  namespace: 'perm',
  name: 'group',
  build: (groupId, featureName) => `aemeath:perm:group:${groupId}:${featureName}`,
})

cacheKeyRegistry.register({
  namespace: 'perm',
  name: 'private',
  build: (featureName, userId) => `aemeath:perm:private:${featureName}:${userId}`,
})

cacheKeyRegistry.register({
  namespace: 'perm',
  name: 'group_enabled',
  build: (groupId) => `aemeath:perm:group_enabled:${groupId}`,
})

cacheKeyRegistry.register({
  namespace: 'session',
  name: 'meta',
  build: (sessionKey) => `aemeath:session:${sessionKey}`,
})

cacheKeyRegistry.register({
  namespace: 'session',
  name: 'data',
  build: (sessionKey) => `aemeath:session:${sessionKey}:data`,
})
