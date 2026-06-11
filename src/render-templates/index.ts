/**
 * 模板注册入口 —— 所有模板在此集中注册，通过 Startup echo 在 renderer 就绪后执行。
 */

import helpTemplate from './help.js'

import { Startup } from '@/core/lifecycle/registry.js'
import type { RenderService } from '@/services/renderer/service.js'

Startup({
  name: 'render_templates',
  provides: [],
  requires: ['renderer'],
})(async (deps: Record<string, unknown>): Promise<Record<string, unknown>> => {
  const renderService = deps.renderer as RenderService
  renderService.register('help', helpTemplate)
  return {}
})
