/** 测试全局配置：Vuetify polyfills 与 @vue/test-utils 全局挂载设置。 */
import { createVuetify } from 'vuetify'
import { config } from '@vue/test-utils'

// Vuetify 的 v-data-table 等组件需要 ResizeObserver
class ResizeObserverStub {
  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// 为所有测试注册 vuetify 插件
const vuetify = createVuetify()
config.global.plugins ??= []
;(config.global.plugins as unknown[]).push(vuetify)
