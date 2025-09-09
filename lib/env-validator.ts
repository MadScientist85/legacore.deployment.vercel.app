export interface ProviderConfig {
  name: string
  enabled: boolean
  hasValidKey: boolean
  keySource: "vercel" | "primary" | "fallback" | "none"
  model?: string
  status: "active" | "fallback" | "disabled" | "error"
}

export interface ValidationResult {
  providers: {
    openai: ProviderConfig
    groq: ProviderConfig
    xai: ProviderConfig
    openrouter: ProviderConfig
  }
  hasAnyProvider: boolean
  recommendedProvider: string
  errors: string[]
  warnings: string[]
}

// API Key validation patterns
const API_KEY_PATTERNS = {
  openai: /^sk-(proj-)?[a-zA-Z0-9_-]{20,}$/,
  groq: /^gsk_[a-zA-Z0-9_-]{20,}$/,
  xai: /^xai-[a-zA-Z0-9_-]{20,}$/,
  grok: /^(grok_|sk-)[a-zA-Z0-9_-]{20,}$/,
  openrouter: /^sk-or-v1-[a-zA-Z0-9_-]{20,}$/,
}

// Model configurations per provider
const PROVIDER_MODELS = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  groq: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "mixtral-8x7b-32768"],
  xai: ["grok-beta", "grok-2", "grok-2-mini"],
  openrouter: ["meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-r1", "reka/reka-flash-3", "openai/gpt-oss-120b"],
}

function validateApiKey(key: string | undefined, provider: keyof typeof API_KEY_PATTERNS): boolean {
  if (!key) return false
  return API_KEY_PATTERNS[provider].test(key)
}

function getProviderConfig(
  provider: "openai" | "groq" | "xai" | "openrouter",
  vercelKey?: string,
  primaryKey?: string,
  fallbackKey?: string,
  enabled = true,
): ProviderConfig {
  const config: ProviderConfig = {
    name: provider.toUpperCase(),
    enabled,
    hasValidKey: false,
    keySource: "none",
    status: "disabled",
  }

  if (!enabled) {
    return config
  }

  // Check keys in priority order: Vercel > Primary > Fallback
  if (validateApiKey(vercelKey, provider === "xai" ? "grok" : provider)) {
    config.hasValidKey = true
    config.keySource = "vercel"
    config.status = "active"
    config.model = PROVIDER_MODELS[provider][0]
  } else if (validateApiKey(primaryKey, provider === "xai" ? "grok" : provider)) {
    config.hasValidKey = true
    config.keySource = "primary"
    config.status = "active"
    config.model = PROVIDER_MODELS[provider][0]
  } else if (validateApiKey(fallbackKey, provider === "xai" ? "grok" : provider)) {
    config.hasValidKey = true
    config.keySource = "fallback"
    config.status = "fallback"
    config.model = PROVIDER_MODELS[provider][0]
  } else {
    config.status = "error"
  }

  return config
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // OpenAI Configuration
  const openaiConfig = getProviderConfig(
    "openai",
    process.env.OPENAI_API_KEY_VERCEL,
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_FALLBACK,
  )

  // Groq Configuration
  const groqConfig = getProviderConfig(
    "groq",
    process.env.GROQ_API_KEY_VERCEL,
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_FALLBACK,
  )

  // xAI/Grok Configuration
  const xaiEnabled = process.env.XAI_ENABLED !== "false"
  const xaiConfig = getProviderConfig(
    "xai",
    process.env.XAI_API_KEY_VERCEL,
    process.env.XAI_API_KEY || process.env.GROK_API_KEY,
    process.env.XAI_API_KEY_FALLBACK || process.env.GROK_API_KEY,
    xaiEnabled,
  )

  // OpenRouter Configuration
  const openrouterConfig = getProviderConfig(
    "openrouter",
    process.env.OPENROUTER_API_KEY_VERCEL,
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_FALLBACK,
  )

  const providers = {
    openai: openaiConfig,
    groq: groqConfig,
    xai: xaiConfig,
    openrouter: openrouterConfig,
  }

  const hasAnyProvider = Object.values(providers).some((p) => p.hasValidKey)

  // Generate warnings for fallback usage
  Object.entries(providers).forEach(([name, config]) => {
    if (config.status === "fallback") {
      warnings.push(`${config.name} using fallback API key`)
    } else if (config.status === "error" && config.enabled) {
      errors.push(`${config.name} has no valid API key`)
    }
  })

  // Determine recommended provider
  let recommendedProvider = "mock"
  if (openaiConfig.hasValidKey) recommendedProvider = "openai"
  else if (groqConfig.hasValidKey) recommendedProvider = "groq"
  else if (xaiConfig.hasValidKey) recommendedProvider = "xai"
  else if (openrouterConfig.hasValidKey) recommendedProvider = "openrouter"

  if (!hasAnyProvider) {
    errors.push("No valid AI provider API keys found")
  }

  return {
    providers,
    hasAnyProvider,
    recommendedProvider,
    errors,
    warnings,
  }
}

export function getActiveProvider(): string {
  const validation = validateEnvironment()
  return validation.recommendedProvider
}

export function getProviderStatus(provider: keyof ValidationResult["providers"]): ProviderConfig {
  const validation = validateEnvironment()
  return validation.providers[provider]
}

export default validateEnvironment
