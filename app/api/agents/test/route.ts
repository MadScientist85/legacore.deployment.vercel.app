import { NextResponse } from "next/server"
import { defaultAgents, getAgentById } from "@/lib/agents.config"
import { aiRouter } from "@/lib/ai-router"
import { trackAgentInteraction, trackTaskOperation } from "@/lib/segment"

interface AgentTestResult {
  agentId: string
  agentName: string
  category: string
  status: "✅ WORKING" | "❌ ERROR"
  testQuery: string
  responsePreview?: string
  error?: string
  provider?: string
  model?: string
  toolsAvailable: number
  toolNames: string[]
  responseTime: number
}

interface IndividualTestRequest {
  agentId: string
  testMessage?: string
  userId?: string
}

export async function GET() {
  const testStartTime = Date.now()

  try {
    const testResults: AgentTestResult[] = []

    await trackTaskOperation({
      taskId: `agent-test-session-${Date.now()}`,
      taskType: "agent_testing",
      action: "created",
      category: "system",
      metadata: {
        total_agents: defaultAgents.length,
        test_type: "bulk_test",
      },
    })

    // Test each agent with a sample query
    for (const agent of defaultAgents) {
      const agentStartTime = Date.now()
      const testMessage = {
        role: "user" as const,
        content: agent.examples[0] || "Hello, can you help me?",
      }

      try {
        const response = await aiRouter.generateResponse(testMessage.content)
        const duration = Date.now() - agentStartTime

        await trackAgentInteraction({
          agentId: agent.id,
          agentName: agent.name,
          action: "complete",
          duration,
          tokens: response.usage?.totalTokens,
          model: response.model,
          category: agent.category,
        })

        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          status: "✅ WORKING",
          testQuery: testMessage.content,
          responsePreview: response.text.substring(0, 200) + "...",
          provider: response.provider,
          model: response.model,
          toolsAvailable: agent.tools.length,
          toolNames: agent.tools.map((t) => t.name),
          responseTime: duration,
        })
      } catch (error) {
        const duration = Date.now() - agentStartTime

        await trackAgentInteraction({
          agentId: agent.id,
          agentName: agent.name,
          action: "error",
          duration,
          category: agent.category,
        })

        testResults.push({
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          status: "❌ ERROR",
          testQuery: testMessage.content,
          error: error instanceof Error ? error.message : "Unknown error",
          toolsAvailable: agent.tools.length,
          toolNames: agent.tools.map((t) => t.name),
          responseTime: duration,
        })
      }
    }

    // Generate summary
    const workingAgents = testResults.filter((r) => r.status === "✅ WORKING").length
    const totalAgents = testResults.length
    const successRate = ((workingAgents / totalAgents) * 100).toFixed(1)
    const totalTestTime = Date.now() - testStartTime

    await trackTaskOperation({
      taskId: `agent-test-session-${testStartTime}`,
      taskType: "agent_testing",
      action: "completed",
      category: "system",
      metadata: {
        total_agents: totalAgents,
        working_agents: workingAgents,
        failed_agents: totalAgents - workingAgents,
        success_rate: Number.parseFloat(successRate),
        total_test_time_ms: totalTestTime,
        test_type: "bulk_test",
      },
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalAgents,
        workingAgents,
        failedAgents: totalAgents - workingAgents,
        successRate: `${successRate}%`,
        totalTestTime: `${(totalTestTime / 1000).toFixed(2)}s`,
        aiProviderStatus: aiRouter.getStatus(),
      },
      agentTests: testResults,
      recommendations: generateRecommendations(testResults),
    })
  } catch (error) {
    console.error("Agent testing error:", error)

    await trackTaskOperation({
      taskId: `agent-test-session-${testStartTime}`,
      taskType: "agent_testing",
      action: "failed",
      category: "system",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        test_duration_ms: Date.now() - testStartTime,
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Agent testing failed",
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(testResults: AgentTestResult[]): string[] {
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

  if (aiStatus.activeProviders.length === 1) {
    recommendations.push("💡 Consider adding backup AI providers for better reliability and fallback options.")
  }

  recommendations.push("📊 Monitor agent performance regularly and update system prompts based on user feedback.")
  recommendations.push("🔄 Test agents after any configuration changes or updates to ensure continued functionality.")

  return recommendations
}

// Test individual agent
export async function POST(request: Request) {
  const testStartTime = Date.now()

  try {
    const { agentId, testMessage, userId }: IndividualTestRequest = await request.json()

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const message = testMessage || agent.examples[0] || "Hello, can you help me?"

    await trackAgentInteraction({
      agentId: agent.id,
      agentName: agent.name,
      userId,
      action: "run",
      category: agent.category,
    })

    const response = await aiRouter.generateResponse(message)

    const duration = Date.now() - testStartTime

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
        response: response.text,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
        duration: `${duration}ms`,
      },
      tools: {
        available: agent.tools.length,
        names: agent.tools.map((t) => t.name),
        details: agent.tools,
      },
    })
  } catch (error) {
    console.error("Individual agent test error:", error)
    const duration = Date.now() - testStartTime

    try {
      const body: IndividualTestRequest = await request.json()
      if (body.agentId) {
        const agent = getAgentById(body.agentId)
        if (agent) {
          await trackAgentInteraction({
            agentId: agent.id,
            agentName: agent.name,
            userId: body.userId,
            action: "error",
            duration,
            category: agent.category,
          })
        }
      }
    } catch {
      // Ignore JSON parsing errors in error handler
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Agent test failed",
      },
      { status: 500 },
    )
  }
}
