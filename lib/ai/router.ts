import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { generateText, generateObject, streamText } from "ai"
import type { AgentConfig } from "@/lib/types/agent"

export class AIRouter {
  private getModel(agent: AgentConfig) {
    if (agent.provider === "openai") {
      return openai(agent.model || "gpt-4")
    } else if (agent.provider === "gemini") {
      return google(agent.model || "gemini-pro")
    }
    throw new Error(`Unsupported AI provider: ${agent.provider}`)
  }

  async generateText(
    agent: AgentConfig,
    prompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
    },
  ) {
    const model = this.getModel(agent)

    try {
      const result = await generateText({
        model,
        prompt: `${agent.systemPrompt}\n\nUser: ${prompt}`,
        temperature: options?.temperature ?? agent.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? agent.maxTokens ?? 2000,
      })

      return {
        success: true,
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
      }
    } catch (error) {
      console.error(`AI Router Error (${agent.provider}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async streamText(
    agent: AgentConfig,
    prompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
    },
  ) {
    const model = this.getModel(agent)

    try {
      const result = await streamText({
        model,
        prompt: `${agent.systemPrompt}\n\nUser: ${prompt}`,
        temperature: options?.temperature ?? agent.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? agent.maxTokens ?? 2000,
      })

      return {
        success: true,
        textStream: result.textStream,
        usage: result.usage,
      }
    } catch (error) {
      console.error(`AI Router Stream Error (${agent.provider}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateObject(
    agent: AgentConfig,
    prompt: string,
    schema: any,
    options?: {
      temperature?: number
      maxTokens?: number
    },
  ) {
    const model = this.getModel(agent)

    try {
      const result = await generateObject({
        model,
        prompt: `${agent.systemPrompt}\n\nUser: ${prompt}`,
        schema,
        temperature: options?.temperature ?? agent.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? agent.maxTokens ?? 2000,
      })

      return {
        success: true,
        object: result.object,
        usage: result.usage,
        finishReason: result.finishReason,
      }
    } catch (error) {
      console.error(`AI Router Object Error (${agent.provider}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getRecommendedProvider(category: string, complexity: "low" | "medium" | "high" = "medium"): "openai" | "gemini" {
    // Route complex legal and financial tasks to OpenAI
    const openaiCategories = ["surplus-funds", "government-contracts", "debt-buying"]

    // Route analysis and advisory tasks to Gemini
    const geminiCategories = ["credit-repair", "debt-collection", "trust-management"]

    if (openaiCategories.includes(category)) {
      return "openai"
    } else if (geminiCategories.includes(category)) {
      return "gemini"
    }

    // Default routing based on complexity
    return complexity === "high" ? "openai" : "gemini"
  }
}

export const aiRouter = new AIRouter()
