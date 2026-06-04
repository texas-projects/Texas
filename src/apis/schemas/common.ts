/**
 * 公共 API 请求/响应 Schema —— 分页、统一响应包装器等。
 */

import { Type } from '@sinclair/typebox'
import type { TSchema } from '@sinclair/typebox'

/** 分页查询参数 Schema。 */
export const PaginationSchema = Type.Object({
  page: Type.Optional(Type.Number({ default: 1, minimum: 1 })),
  pageSize: Type.Optional(Type.Number({ default: 20, minimum: 1, maximum: 100 })),
})

/**
 * 构造成功响应 Schema 包装器。
 */
export function OkResponse<T extends TSchema>(dataSchema: T) {
  return Type.Object({
    code: Type.Literal(0),
    data: dataSchema,
    message: Type.String(),
  })
}

/**
 * 构造失败响应 Schema 包装器。
 */
export function FailResponse() {
  return Type.Object({
    code: Type.Literal(-1),
    data: Type.Unknown(),
    message: Type.String(),
  })
}
