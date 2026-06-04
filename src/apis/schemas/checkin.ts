/**
 * 用户群签到 API 请求/响应 Schema（TypeBox）。
 */

import { Type } from '@sinclair/typebox'

/** 单条签到记录响应 Schema。 */
export const CheckinRecordResponseSchema = Type.Object({
  id: Type.Number(),
  groupId: Type.Number(),
  userId: Type.Number(),
  checkinDate: Type.String({ description: 'ISO date string' }),
  checkinAt: Type.String({ description: 'ISO datetime string' }),
})

/** 分页签到记录响应 Schema。 */
export const PaginatedCheckinsResponseSchema = Type.Object({
  items: Type.Array(CheckinRecordResponseSchema),
  total: Type.Number(),
  page: Type.Number(),
  pageSize: Type.Number(),
  pages: Type.Number(),
})

/** 排行榜条目 Schema。 */
export const LeaderEntryResponseSchema = Type.Object({
  rank: Type.Number(),
  userId: Type.Number(),
  value: Type.Number({ description: '累计天数或连续天数，由请求 by 参数决定' }),
})

/** 每日签到人数数据点 Schema。 */
export const DayCountResponseSchema = Type.Object({
  date: Type.String(),
  count: Type.Number(),
})

/** 汇总卡片数据 Schema。 */
export const SummaryResponseSchema = Type.Object({
  totalCheckins: Type.Number(),
  todayCheckins: Type.Number(),
  activeUsers: Type.Number(),
})
