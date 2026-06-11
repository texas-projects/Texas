// src/core/personnel/cache-keys.ts
/** personnel 领域 cache key 自注册。 */
import { cacheKeyRegistry } from '@/core/registries/index.js'

cacheKeyRegistry.register({
  namespace: 'personnel',
  name: 'sync_status',
  build: () => 'aemeath:personnel:sync_status',
})

cacheKeyRegistry.register({
  namespace: 'personnel',
  name: 'sync_lock',
  build: () => 'aemeath:lock:personnel_sync',
})

cacheKeyRegistry.register({
  namespace: 'personnel',
  name: 'relation',
  build: (qq) => `aemeath:personnel:user:${qq}:relation`,
})

cacheKeyRegistry.register({
  namespace: 'personnel',
  name: 'admins',
  build: () => 'aemeath:personnel:admins',
})
