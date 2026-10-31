export type AiProvider = 'openai' | 'anthropic' | 'custom'

export interface AiConfig {
  provider: AiProvider
  baseUrl: string
  model: string
  apiKey: string
  persistKey: boolean
  temperature: number
  maxTokens: number
}

const KEY = 'tianji.ai.v1'
const SESSION_KEY = 'tianji.ai.session.v1'

export const DEFAULT_AI_CONFIG: Omit<AiConfig, 'apiKey'> = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  persistKey: false,
  temperature: 0.7,
  maxTokens: 1200,
}

function storage(persist: boolean): Storage | null {
  try {
    return persist ? localStorage : sessionStorage
  } catch {
    return null
  }
}

function allowedEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 500) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  } catch {
    return false
  }
}

function safeConfig(parsed: Partial<AiConfig>): AiConfig {
  const provider: AiProvider = parsed.provider === 'anthropic' || parsed.provider === 'custom' ? parsed.provider : 'openai'
  const baseUrl = allowedEndpoint(parsed.baseUrl) ? parsed.baseUrl : DEFAULT_AI_CONFIG.baseUrl
  const model = typeof parsed.model === 'string' && parsed.model.trim().length > 0 ? parsed.model.trim().slice(0, 120) : DEFAULT_AI_CONFIG.model
  const temperature = typeof parsed.temperature === 'number' && Number.isFinite(parsed.temperature) ? Math.min(1.5, Math.max(0, parsed.temperature)) : DEFAULT_AI_CONFIG.temperature
  const maxTokens = typeof parsed.maxTokens === 'number' && Number.isInteger(parsed.maxTokens) ? Math.min(8000, Math.max(128, parsed.maxTokens)) : DEFAULT_AI_CONFIG.maxTokens
  return {
    ...DEFAULT_AI_CONFIG,
    provider,
    baseUrl,
    model,
    temperature,
    maxTokens,
    apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.slice(0, 512) : '',
    persistKey: parsed.persistKey === true,
  }
}

export function loadAiConfig(): AiConfig {
  const raw = (() => {
    try {
      return localStorage.getItem(KEY) ?? sessionStorage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  })()
  if (!raw) return { ...DEFAULT_AI_CONFIG, apiKey: '' }
  try {
    return safeConfig(JSON.parse(raw) as Partial<AiConfig>)
  } catch {
    return { ...DEFAULT_AI_CONFIG, apiKey: '' }
  }
}

export function saveAiConfig(config: AiConfig): void {
  const clean = safeConfig(config)
  const target = storage(clean.persistKey)
  if (!target) return
  const payload = JSON.stringify(clean)
  try {
    target.setItem(clean.persistKey ? KEY : SESSION_KEY, payload)
    if (clean.persistKey) sessionStorage.removeItem(SESSION_KEY)
    else localStorage.removeItem(KEY)
  } catch {
  }
}

export function applyProviderPreset(config: AiConfig, provider: AiProvider): AiConfig {
  const presets: Record<AiProvider, Pick<AiConfig, 'baseUrl' | 'model'>> = {
    openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-haiku-latest' },
    custom: { baseUrl: config.baseUrl, model: config.model },
  }
  return { ...config, provider, ...presets[provider] }
}

export function clearAiConfig(): void {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
  }
}

export function maskedKey(key: string): string {
  if (!key) return '未设置'
  if (key.length <= 8) return '已设置'
  return `${key.slice(0, 3)}••••${key.slice(-4)}`
}
