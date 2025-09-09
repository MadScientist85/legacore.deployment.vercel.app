import { NextResponse } from "next/server"
import { aiRouter } from "@/lib/ai-router"
import { getAgentById } from "@/lib/agents.config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, agentId } = body

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
    const systemPrompt = agent?.systemPrompt || "You are a helpful AI assistant."

    // Prepare messages for AI
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ]

    // Check if AI is configured
    const aiStatus = aiRouter.getStatus()
    if (!aiStatus.hasAnyProvider) {
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

    return NextResponse.json({
      success: true,
      data: {
        message: response.content,
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
