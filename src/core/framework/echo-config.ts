// src/core/framework/echo-config.ts
/** Echo 配置定义与工具函数。 */

export type EchoType = 'handler' | 'service' | 'task' | 'route'

export type EchoDirConfig = string[] | { dirs: string[]; exclude?: string[] }

export interface EchoConfig {
  echoes: Record<EchoType, EchoDirConfig>
}

export interface NormalizedEchoDirConfig {
  dirs: string[]
  exclude: string[]
}

export function defineConfig(config: EchoConfig): EchoConfig {
  return config
}

export function normalizeEchoDirConfig(config: EchoDirConfig): NormalizedEchoDirConfig {
  if (Array.isArray(config)) {
    return { dirs: config, exclude: [] }
  }
  return { dirs: config.dirs, exclude: config.exclude ?? [] }
}
