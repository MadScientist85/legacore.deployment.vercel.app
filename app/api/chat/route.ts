import { NextResponse } from "next/server"
import { aiRouter } from "@/lib/ai-router"
import { getAgentById } from "@/lib/agents.config"
import { trackAgentInteraction, trackChatMessage } from "@/lib/segment"
import type { Agent } from "@/lib/supabase"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequestBody {
  messages: ChatMessage[]
  agentId?: string
  userId?: string
  taskId?: string
}

export async function POST(request: Request) {
  const startTime = Date.now()
  let agentData: Agent | null = null
  const body: ChatRequestBody = await request.json()

  try {
    const { messages, agentId, userId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Messages array is required",
        },
        { status: 400 },
      )
    }

    // Get agent configuration
    const agent = agentId ? getAgentById(agentId) : null
    agentData = agent
    const systemPrompt = agent?.systemPrompt || "You are a helpful AI assistant."

    if (agent) {
      await trackAgentInteraction({
        agentId: agent.id,
        agentName: agent.name,
        userId,
        action: "run",
        category: agent.category,
      })
    }

    // Prepare messages for AI
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: ChatMessage) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ]

    // Check if AI is configured
    const aiStatus = aiRouter.getStatus()
    if (!aiStatus.hasAnyProvider) {
      if (agent) {
        await trackAgentInteraction({
          agentId: agent.id,
          agentName: agent.name,
          userId,
          action: "error",
          duration: Date.now() - startTime,
          category: agent.category,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: "No AI providers configured. Please set up OpenAI, xAI, or Groq API keys.",
        },
        { status: 503 },
      )
    }

    // Generate response
    const response = await aiRouter.generateResponse(aiMessages)
    const duration = Date.now() - startTime

    if (agent) {
      await trackAgentInteraction({
        agentId: agent.id,
        agentName: agent.name,
        userId,
        action: "complete",
        duration,
        tokens: response.usage?.totalTokens,
        model: response.model,
        category: agent.category,
      })
    }

    const userMessage = messages[messages.length - 1]
    await trackChatMessage({
      agentId: agent?.id,
      agentName: agent?.name,
      userId,
      taskId: body.taskId,
      taskType: "chat",
      action: "completed",
      category: agent?.category,
      metadata: {
        message_length: userMessage?.content?.length || 0,
        response_length: response.text.length,
        response_time_ms: duration,
        model: response.model,
        provider: response.provider,
        tokens_used: response.usage?.totalTokens,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: response.text,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        agent: agent
          ? {
              id: agent.id,
              name: agent.name,
              category: agent.category,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    const duration = Date.now() - startTime

    if (agentData) {
      await trackAgentInteraction({
        agentId: agentData.id,
        agentName: agentData.name,
        userId: body?.userId,
        action: "error",
        duration,
        category: agentData.category,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Chat generation failed",
        fallback: "I apologize, but I'm currently unable to process your request. Please try again later.",
      },
      { status: 500 },
    )
  }
}
