import OpenAI from "openai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"
import { createGroq } from "@ai-sdk/groq"
import { generateText, streamText } from "ai"
import { validateEnvironment, type ValidationResult, type ProviderConfig } from "./env-validator"

export interface AIResponse {
  text: string
  provider: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface StreamResponse {
  stream: ReadableStream<Uint8Array> | AsyncIterable<string> | any
  provider: string
  model: string
}

export interface AIRouterConfig {
  preferredProvider?: "openai" | "openrouter" | "auto"
  loadBalancing?: boolean
  maxRetries?: number
  timeoutMs?: number
}

class AIRouter {
  private validation: ValidationResult
  private openrouterClient: OpenAI | null = null
  private config: AIRouterConfig
  private requestCounts: Map<string, number> = new Map()
  private lastUsedProvider: string | null = null

  constructor(config: AIRouterConfig = {}) {
    this.validation = validateEnvironment()
    this.config = {
      preferredProvider: "auto",
      loadBalancing: true,
      maxRetries: 3,
      timeoutMs: 30000,
      ...config,
    }
    this.initializeOpenRouter()
  }

  private initializeOpenRouter() {
    const openrouterConfig = this.validation.providers.openrouter
    if (openrouterConfig.hasValidKey) {
      const apiKey = this.getOpenRouterKey()
      if (apiKey) {
        this.openrouterClient = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey,
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "LEGACORE Platform",
          },
        })
      }
    }
  }

  private getOpenRouterKey(): string | null {
    return (
      process.env.OPENROUTER_API_KEY_VERCEL ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY_FALLBACK ||
      null
    )
  }

  private getOpenAIKey(): string | null {
    return (
      process.env.OPENAI_API_KEY_VERCEL || process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK || null
    )
  }

  private getGroqKey(): string | null {
    return process.env.GROQ_API_KEY_VERCEL || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_FALLBACK || null
  }

  private getXAIKey(): string | null {
    return (
      process.env.XAI_API_KEY_VERCEL ||
      process.env.XAI_API_KEY ||
      process.env.GROK_API_KEY ||
      process.env.XAI_API_KEY_FALLBACK ||
      null
    )
  }

  private getProviderOrder(): Array<{ name: string; config: ProviderConfig }> {
    const { openai, openrouter, groq, xai } = this.validation.providers

    if (this.config.preferredProvider === "openai" && openai.hasValidKey) {
      return [
        { name: "openai", config: openai },
        { name: "openrouter", config: openrouter },
        { name: "groq", config: groq },
        { name: "xai", config: xai },
      ]
    }

    if (this.config.preferredProvider === "openrouter" && openrouter.hasValidKey) {
      return [
        { name: "openrouter", config: openrouter },
        { name: "openai", config: openai },
        { name: "groq", config: groq },
        { name: "xai", config: xai },
      ]
    }

    const providers = [
      { name: "openai", config: openai, priority: 1 },
      { name: "openrouter", config: openrouter, priority: 2 },
      { name: "groq", config: groq, priority: 3 },
      { name: "xai", config: xai, priority: 4 },
    ]

    if (this.config.loadBalancing && openai.hasValidKey && openrouter.hasValidKey) {
      const openaiCount = this.requestCounts.get("openai") || 0
      const openrouterCount = this.requestCounts.get("openrouter") || 0

      if (openaiCount <= openrouterCount) {
        providers[0].priority = 1
        providers[1].priority = 2
      } else {
        providers[0].priority = 2
        providers[1].priority = 1
      }
    }

    return providers
      .filter((p) => p.config.hasValidKey)
      .sort((a, b) => a.priority - b.priority)
      .map(({ name, config }) => ({ name, config }))
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const providers = this.getProviderOrder()
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.maxRetries!; attempt++) {
      for (const { name, config } of providers) {
        if (!config.hasValidKey) continue

        try {
          console.log(`[v0] Attempting ${name} provider (attempt ${attempt + 1})`)

          const response = await Promise.race([
            this.executeProvider(name, prompt, systemPrompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), this.config.timeoutMs)),
          ])

          this.incrementRequestCount(name)
          this.lastUsedProvider = name

          console.log(`[v0] Successfully used ${name} provider`)
          return response
        } catch (error) {
          lastError = error as Error
          console.warn(`[v0] ${name} provider failed (attempt ${attempt + 1}):`, error)
          continue
        }
      }
    }

    return {
      text: `AI services are currently unavailable. Tried ${providers.length} providers with ${this.config.maxRetries} retries each. Last error: ${lastError?.message || "Unknown error"}`,
      provider: "fallback",
      model: "error",
    }
  }

  private async executeProvider(name: string, prompt: string, systemPrompt?: string): Promise<AIResponse> {
    switch (name) {
      case "openai":
        return await this.generateWithOpenAI(prompt, systemPrompt)
      case "groq":
        return await this.generateWithGroq(prompt, systemPrompt)
      case "xai":
        return await this.generateWithXAI(prompt, systemPrompt)
      case "openrouter":
        return await this.generateWithOpenRouter(prompt, systemPrompt)
      default:
        throw new Error(`Unknown provider: ${name}`)
    }
  }

  private incrementRequestCount(provider: string) {
    const current = this.requestCounts.get(provider) || 0
    this.requestCounts.set(provider, current + 1)
  }

  async streamResponse(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    const providers = this.getProviderOrder()

    for (const { name, config } of providers) {
      if (!config.hasValidKey) continue

      try {
        console.log(`[v0] Streaming with ${name} provider`)
        const response = await this.executeStreamProvider(name, prompt, systemPrompt)
        this.incrementRequestCount(name)
        this.lastUsedProvider = name
        return response
      } catch (error) {
        console.warn(`[v0] ${name} streaming failed:`, error)
        continue
      }
    }

    throw new Error("No AI providers available for streaming")
  }

  private async executeStreamProvider(name: string, prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    switch (name) {
      case "openai":
        return await this.streamWithOpenAI(prompt, systemPrompt)
      case "groq":
        return await this.streamWithGroq(prompt, systemPrompt)
      case "xai":
        return await this.streamWithXAI(prompt, systemPrompt)
      case "openrouter":
        return await this.streamWithOpenRouter(prompt, systemPrompt)
      default:
        throw new Error(`Unknown provider: ${name}`)
    }
  }

  private async generateWithOpenAI(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const model = process.env.OPENAI_MODEL || "gpt-4o"

    const result = await generateText({
      model: openai(model),
      prompt,
      system: systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    })

    return {
      text: result.text,
      provider: "openai",
      model,
      usage: result.usage,
    }
  }

  private async generateWithGroq(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const groq = createGroq({
      apiKey: this.getGroqKey()!,
    })

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      system: systemPrompt,
    })

    return {
      text: result.text,
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      usage: result.usage,
    }
  }

  private async generateWithXAI(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      system: systemPrompt,
    })

    return {
      text: result.text,
      provider: "xai",
      model: "grok-beta",
      usage: result.usage,
    }
  }

  private async generateWithOpenRouter(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.openrouterClient) {
      throw new Error("OpenRouter client not initialized")
    }

    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct"

    const response = await this.openrouterClient.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    })

    return {
      text: response.choices[0]?.message?.content || "No response generated",
      provider: "openrouter",
      model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    }
  }

  private async streamWithOpenAI(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    const model = process.env.OPENAI_MODEL || "gpt-4o"

    const result = await streamText({
      model: openai(model),
      prompt,
      system: systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    })

    return {
      stream: result.textStream,
      provider: "openai",
      model,
    }
  }

  private async streamWithGroq(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    const groq = createGroq({
      apiKey: this.getGroqKey()!,
    })

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      system: systemPrompt,
    })

    return {
      stream: result.textStream,
      provider: "groq",
      model: "llama-3.3-70b-versatile",
    }
  }

  private async streamWithXAI(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    const result = await streamText({
      model: xai("grok-beta"),
      prompt,
      system: systemPrompt,
    })

    return {
      stream: result.textStream,
      provider: "xai",
      model: "grok-beta",
    }
  }

  private async streamWithOpenRouter(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    if (!this.openrouterClient) {
      throw new Error("OpenRouter client not initialized")
    }

    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct"

    const stream = await this.openrouterClient.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
      stream: true,
    })

    return {
      stream,
      provider: "openrouter",
      model,
    }
  }

  getStatus() {
    return {
      validation: this.validation,
      hasAnyProvider: this.validation.hasAnyProvider,
      recommendedProvider: this.validation.recommendedProvider,
      config: this.config,
      lastUsedProvider: this.lastUsedProvider,
      requestCounts: Object.fromEntries(this.requestCounts),
      activeProviders: Object.entries(this.validation.providers)
        .filter(([_, config]) => config.hasValidKey)
        .map(([name, config]) => ({
          name,
          status: config.status,
          model: config.model,
          keySource: config.keySource,
          requestCount: this.requestCounts.get(name) || 0,
        })),
    }
  }

  updateConfig(newConfig: Partial<AIRouterConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  resetRequestCounts() {
    this.requestCounts.clear()
  }
}

export const aiRouter = new AIRouter()
export const openaiFirstRouter = new AIRouter({ preferredProvider: "openai" })
export const openrouterFirstRouter = new AIRouter({ preferredProvider: "openrouter" })

export default aiRouter
