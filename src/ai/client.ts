import type { AiConfig } from './config'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  config: AiConfig
  messages: ChatMessage[]
  signal?: AbortSignal
  onDelta?: (delta: string) => void
}

export interface ChatResult {
  text: string
  model: string
}

function endpoint(config: AiConfig): string {
  return `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, external?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (external) {
    if (external.aborted) controller.abort()
    else external.addEventListener('abort', abort, { once: true })
  }
  const timer = setTimeout(() => controller.abort(), 45_000)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    external?.removeEventListener('abort', abort)
  }
}

function extractOpenAiText(payload: unknown): string {
  const choice = (payload as { choices?: Array<{ message?: { content?: unknown }; delta?: { content?: unknown } }> })
    .choices?.[0]
  const message = choice?.message?.content ?? choice?.delta?.content
  return typeof message === 'string' ? message : ''
}

async function readSse(response: Response, onDelta: (delta: string) => void): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  for (;;) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const raw = line.slice(5).trim()
      if (!raw || raw === '[DONE]') continue
      try {
        const delta = extractOpenAiText(JSON.parse(raw))
        if (delta) {
          text += delta
          onDelta(delta)
        }
      } catch {
      }
    }
    if (done) break
  }
  return text
}

async function openAiChat(request: ChatRequest): Promise<ChatResult> {
  const { config } = request
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      messages: request.messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: Boolean(request.onDelta),
    }),
  }
  if (request.signal) init.signal = request.signal
  const response = await fetchWithTimeout(endpoint(config), init, request.signal)
  if (!response.ok) throw new Error(`模型接口返回 ${response.status}`)
  if (!request.onDelta) {
    const payload = (await response.json()) as unknown
    return { text: extractOpenAiText(payload), model: config.model }
  }
  return { text: await readSse(response, request.onDelta), model: config.model }
}

async function anthropicChat(request: ChatRequest): Promise<ChatResult> {
  const { config } = request
  const system = request.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n')
  const messages = request.messages.filter((message) => message.role !== 'system')
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      system,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: Boolean(request.onDelta),
    }),
  }
  if (request.signal) init.signal = request.signal
  const response = await fetchWithTimeout(`${config.baseUrl.replace(/\/$/, '')}/messages`, init, request.signal)
  if (!response.ok) throw new Error(`模型接口返回 ${response.status}`)
  if (!request.onDelta) {
    const payload = (await response.json()) as { content?: Array<{ text?: unknown }> }
    return { text: typeof payload.content?.[0]?.text === 'string' ? payload.content[0].text : '', model: config.model }
  }
  return { text: await readAnthropicSse(response, request.onDelta), model: config.model }
}

async function readAnthropicSse(response: Response, onDelta: (delta: string) => void): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  for (;;) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      try {
        const payload = JSON.parse(line.slice(5).trim()) as { type?: string; delta?: { text?: unknown } }
        const delta = payload.type === 'content_block_delta' && typeof payload.delta?.text === 'string' ? payload.delta.text : ''
        if (delta) {
          text += delta
          onDelta(delta)
        }
      } catch {
      }
    }
    if (done) break
  }
  return text
}

export async function chat(request: ChatRequest): Promise<ChatResult> {
  if (!request.config.apiKey) throw new Error('未设置模型 Key，已切换离线规则模式。')
  if (request.config.provider === 'anthropic') return anthropicChat(request)
  return openAiChat(request)
}

export function redactConfig(config: AiConfig): Omit<AiConfig, 'apiKey'> & { apiKey: string } {
  return { ...config, apiKey: config.apiKey ? '[已隐藏]' : '' }
}
