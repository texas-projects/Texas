/**
 * OneBot 11 基础事件类型与枚举。
 */

/** 事件顶层类型（post_type 字段）。 */
export const PostType = {
  message: 'message',
  messageSent: 'message_sent',
  notice: 'notice',
  request: 'request',
  metaEvent: 'meta_event',
} as const
export type PostType = (typeof PostType)[keyof typeof PostType]

/** 消息类型（message_type 字段）。 */
export const MessageType = {
  private: 'private',
  group: 'group',
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

/** 通知类型（notice_type 字段）。 */
export const NoticeType = {
  friendAdd: 'friend_add',
  friendRecall: 'friend_recall',
  groupUpload: 'group_upload',
  groupAdmin: 'group_admin',
  groupDecrease: 'group_decrease',
  groupIncrease: 'group_increase',
  groupBan: 'group_ban',
  groupRecall: 'group_recall',
  groupCard: 'group_card',
  essence: 'essence',
  groupMsgEmojiLike: 'group_msg_emoji_like',
  notify: 'notify',
  botOffline: 'bot_offline',
} as const
export type NoticeType = (typeof NoticeType)[keyof typeof NoticeType]

/** 请求类型（request_type 字段）。 */
export const RequestType = {
  friend: 'friend',
  group: 'group',
} as const
export type RequestType = (typeof RequestType)[keyof typeof RequestType]

/** 元事件类型（meta_event_type 字段）。 */
export const MetaEventType = {
  lifecycle: 'lifecycle',
  heartbeat: 'heartbeat',
} as const
export type MetaEventType = (typeof MetaEventType)[keyof typeof MetaEventType]

/** 群成员角色。 */
export const GroupRole = {
  owner: 'owner',
  admin: 'admin',
  member: 'member',
} as const
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole]

/** 消息发送者信息。 */
export interface Sender {
  user_id?: number | null
  nickname?: string | null
  sex?: string | null
  age?: number | null
  card?: string | null
  role?: string | null
  title?: string | null
  level?: string | null
  area?: string | null
  group_id?: number | null
  [key: string]: unknown
}

/** 匿名发送者信息。 */
export interface Anonymous {
  id: number
  name: string
  flag: string
  [key: string]: unknown
}

/** 心跳事件中的状态信息。 */
export interface HeartbeatStatus {
  online?: boolean | null
  good: boolean
  [key: string]: unknown
}

/** 所有 OneBot 11 事件的基础接口。 */
export interface OneBotEvent {
  time: number
  self_id: number
  post_type: string
  [key: string]: unknown
}

/** 消息段基础接口。 */
export interface MessageSegment {
  type: string
  data: Record<string, unknown>
}
