import OpenAI from "openai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"
import { createGroq } from "@ai-sdk/groq"
import { generateText, streamText } from "ai"
import { validateEnvironment, type ValidationResult } from "./env-validator"

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

class AIRouter {
  private validation: ValidationResult
  private openrouterClient: OpenAI | null = null

  constructor() {
    this.validation = validateEnvironment()
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

  async generateResponse(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const providers = [
      { name: "openai", config: this.validation.providers.openai },
      { name: "groq", config: this.validation.providers.groq },
      { name: "xai", config: this.validation.providers.xai },
      { name: "openrouter", config: this.validation.providers.openrouter },
    ]

    // Try providers in order of preference
    for (const { name, config } of providers) {
      if (!config.hasValidKey) continue

      try {
        switch (name) {
          case "openai":
            return await this.generateWithOpenAI(prompt, systemPrompt)
          case "groq":
            return await this.generateWithGroq(prompt, systemPrompt)
          case "xai":
            return await this.generateWithXAI(prompt, systemPrompt)
          case "openrouter":
            return await this.generateWithOpenRouter(prompt, systemPrompt)
        }
      } catch (error) {
        console.warn(`${name} provider failed:`, error)
        continue
      }
    }

    // Fallback to mock response
    return {
      text: "AI services are currently unavailable. Please check your API configuration or try again later.",
      provider: "mock",
      model: "fallback",
    }
  }

  async streamResponse(prompt: string, systemPrompt?: string): Promise<StreamResponse> {
    const providers = [
      { name: "openai", config: this.validation.providers.openai },
      { name: "groq", config: this.validation.providers.groq },
      { name: "xai", config: this.validation.providers.xai },
      { name: "openrouter", config: this.validation.providers.openrouter },
    ]

    for (const { name, config } of providers) {
      if (!config.hasValidKey) continue

      try {
        switch (name) {
          case "openai":
            return await this.streamWithOpenAI(prompt, systemPrompt)
          case "groq":
            return await this.streamWithGroq(prompt, systemPrompt)
          case "xai":
            return await this.streamWithXAI(prompt, systemPrompt)
          case "openrouter":
            return await this.streamWithOpenRouter(prompt, systemPrompt)
        }
      } catch (error) {
        console.warn(`${name} streaming failed:`, error)
        continue
      }
    }

    throw new Error("No AI providers available for streaming")
  }

  private async generateWithOpenAI(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const result = await generateText({
      model: openai("gpt-4"),
      prompt,
      system: systemPrompt,
    })

    return {
      text: result.text,
      provider: "openai",
      model: "gpt-4",
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

    const response = await this.openrouterClient.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    return {
      text: response.choices[0]?.message?.content || "No response generated",
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct",
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
    const result = await streamText({
      model: openai("gpt-4"),
      prompt,
      system: systemPrompt,
    })

    return {
      stream: result.textStream,
      provider: "openai",
      model: "gpt-4",
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

    const stream = await this.openrouterClient.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true,
    })

    return {
      stream,
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct",
    }
  }

  getStatus() {
    return {
      validation: this.validation,
      hasAnyProvider: this.validation.hasAnyProvider,
      recommendedProvider: this.validation.recommendedProvider,
      activeProviders: Object.entries(this.validation.providers)
        .filter(([_, config]) => config.hasValidKey)
        .map(([name, config]) => ({
          name,
          status: config.status,
          model: config.model,
          keySource: config.keySource,
        })),
    }
  }

  refreshValidation() {
    this.validation = validateEnvironment()
    this.initializeOpenRouter()
  }
}

export const aiRouter = new AIRouter()
export default aiRouter
