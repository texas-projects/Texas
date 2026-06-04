/**
 * LLM 高层调用接口 —— 供 Handler 通过注入的 LLMService 使用。
 *
 * 使用方式（Handler 中推荐）：
 *   const llm = ctx.getService<LLMService>('llm_service')
 *
 *   // 一次性获取完整回复
 *   const reply = await llmComplete(llm, 'deepseek-chat', [
 *     { role: 'user', content: '你好' }
 *   ])
 *
 *   // 流式获取回复
 *   for await (const chunk of llmStream(llm, 'gpt-4o', messages)) {
 *     process.stdout.write(chunk)
 *   }
 */

import type { LLMService } from './main.js'

/** 对话消息格式。 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** llmComplete / llmStream 共用选项。 */
export interface LlmCallOptions {
  temperature?: number
  maxTokens?: number
}

/**
 * 一次性调用 LLM 并返回完整文本回复。
 *
 * @param service    - LLMService 实例
 * @param modelName  - 模型标识（如 "gpt-4o"、"deepseek-chat"）
 * @param messages   - OpenAI 格式消息列表
 * @param opts       - 可选覆盖参数
 */
export async function llmComplete(
  service: LLMService,
  modelName: string,
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<string> {
  return service.chatByName(modelName, messages, {
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    stream: false,
  })
}

/**
 * 流式调用 LLM，逐块 yield 文本内容。
 *
 * @param service    - LLMService 实例
 * @param modelName  - 模型标识
 * @param messages   - OpenAI 格式消息列表
 * @param opts       - 可选覆盖参数
 */
export async function* llmStream(
  service: LLMService,
  modelName: string,
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): AsyncGenerator<string> {
  yield* service.chatStreamByName(modelName, messages, {
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
  })
}
