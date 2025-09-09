import { NextResponse } from "next/server"
import { defaultAgents, getAgentById } from "@/lib/agents.config"
import { aiRouter } from "@/lib/ai-router"

export async function GET() {
  try {
    const testResults = []

    // Test each agent with a sample query
    for (const agent of defaultAgents) {
      const testMessage = {
        role: "user" as const,
        content: agent.examples[0] || "Hello, can you help me?",
      }

      try {
        const response = await aiRouter.generateResponse([testMessage])

        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          status: "✅ WORKING",
          testQuery: testMessage.content,
          responsePreview: response.content.substring(0, 200) + "...",
          provider: response.provider,
          model: response.model,
          toolsAvailable: agent.tools.length,
          toolNames: agent.tools.map((t) => t.name),
        })
      } catch (error) {
        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          status: "❌ ERROR",
          testQuery: testMessage.content,
          error: error instanceof Error ? error.message : "Unknown error",
          toolsAvailable: agent.tools.length,
          toolNames: agent.tools.map((t) => t.name),
        })
      }
    }

    // Generate summary
    const workingAgents = testResults.filter((r) => r.status === "✅ WORKING").length
    const totalAgents = testResults.length
    const successRate = ((workingAgents / totalAgents) * 100).toFixed(1)

    return NextResponse.json({
      success: true,
      summary: {
        totalAgents,
        workingAgents,
        failedAgents: totalAgents - workingAgents,
        successRate: `${successRate}%`,
        aiProviderStatus: aiRouter.getStatus(),
      },
      agentTests: testResults,
      recommendations: generateRecommendations(testResults),
    })
  } catch (error) {
    console.error("Agent testing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Agent testing failed",
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(testResults: any[]): string[] {
  const recommendations = []
  const failedAgents = testResults.filter((r) => r.status === "❌ ERROR")

  if (failedAgents.length === 0) {
    recommendations.push("🎉 All agents are working perfectly! Your LEGACORE platform is fully operational.")
  } else {
    recommendations.push(`⚠️ ${failedAgents.length} agents need attention. Check AI provider configuration.`)
  }

  const aiStatus = aiRouter.getStatus()
  if (!aiStatus.hasAnyProvider) {
    recommendations.push("🔧 Configure at least one AI provider (OpenAI, xAI, or Groq) in environment variables.")
  }

  if (aiStatus.providers.filter((p) => p.available).length === 1) {
    recommendations.push("💡 Consider adding backup AI providers for better reliability and fallback options.")
  }

  recommendations.push("📊 Monitor agent performance regularly and update system prompts based on user feedback.")
  recommendations.push("🔄 Test agents after any configuration changes or updates to ensure continued functionality.")

  return recommendations
}

// Test individual agent
export async function POST(request: Request) {
  try {
    const { agentId, testMessage } = await request.json()

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const message = testMessage || agent.examples[0] || "Hello, can you help me?"

    const response = await aiRouter.generateResponse([
      {
        role: "user",
        content: message,
      },
    ])

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        category: agent.category,
        description: agent.description,
      },
      test: {
        query: message,
        response: response.content,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
      },
      tools: {
        available: agent.tools.length,
        names: agent.tools.map((t) => t.name),
        details: agent.tools,
      },
    })
  } catch (error) {
    console.error("Individual agent test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Agent test failed",
      },
      { status: 500 },
    )
  }
}
