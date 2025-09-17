import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get all agents with metrics
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: agents, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Get metrics for each agent
    const agentMetrics: Record<string, any> = {}
    for (const agent of agents || []) {
      const { data: tasks } = await supabase.from("agent_tasks").select("status, created_at").eq("agent_id", agent.id)

      const { data: threads } = await supabase.from("agent_threads").select("id").eq("agent_id", agent.id)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0
      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      agentMetrics[agent.id] = {
        totalInteractions: totalTasks,
        successRate: Math.round(successRate),
        avgResponseTime: Math.floor(Math.random() * 500) + 200, // Mock data
        lastUsed: tasks?.[0]?.created_at || agent.created_at,
        errorCount: tasks?.filter((t) => t.status === "failed").length || 0,
        activeThreads: threads?.length || 0,
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        agents: agents || [],
        metrics: agentMetrics,
      },
    })
  } catch (error) {
    console.error("Agent management error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch agents",
      },
      { status: 500 },
    )
  }
}

// Create new agent
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        agent_id: `agent-${Date.now()}`,
        name: body.name,
        description: body.description,
        category: body.category,
        system_prompt: body.systemPrompt,
        provider: body.provider,
        model: body.model,
        temperature: body.temperature,
        max_tokens: body.maxTokens,
        active: body.active,
        tools: body.tools || [],
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: agent,
    })
  } catch (error) {
    console.error("Agent creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create agent",
      },
      { status: 500 },
    )
  }
}

// Update agent
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data: agent, error } = await supabase
      .from("agents")
      .update({
        name: body.name,
        description: body.description,
        category: body.category,
        system_prompt: body.systemPrompt,
        provider: body.provider,
        model: body.model,
        temperature: body.temperature,
        max_tokens: body.maxTokens,
        active: body.active,
        tools: body.tools || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: agent,
    })
  } catch (error) {
    console.error("Agent update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update agent",
      },
      { status: 500 },
    )
  }
}

// Delete agent
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("id")

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("agents").delete().eq("id", agentId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    })
  } catch (error) {
    console.error("Agent deletion error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete agent",
      },
      { status: 500 },
    )
  }
}
