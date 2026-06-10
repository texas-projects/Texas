/**
 * 模板注册入口 —— 所有模板在此集中注册。
 */

import helpTemplate from './help.js'

import { renderService } from '@/core/renderer/index.js'

renderService.register('help', helpTemplate)
