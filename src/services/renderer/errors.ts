/** 渲染领域异常类。 */

import { AppError } from '@/core/errors.js'

/** 模板未找到。 */
export class TemplateNotFoundError extends AppError {
  constructor(name: string) {
    super(-1, `Template not found: ${name}`, 500)
    this.name = 'TemplateNotFoundError'
  }
}

/** 模板执行异常。 */
export class TemplateRenderError extends AppError {
  constructor(name: string, cause: unknown) {
    super(-1, `Template render failed: ${name}`, 500)
    this.name = 'TemplateRenderError'
    this.cause = cause
  }
}

/** 渲染管线异常。 */
export class RenderError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(-1, message, 500)
    this.name = 'RenderError'
    if (cause !== undefined) this.cause = cause
  }
}
