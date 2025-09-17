import { NextResponse } from "next/server"
import { executionPipeline } from "@/lib/agents/execution-pipeline"
import { getAgentById } from "@/lib/agents.config"

interface ExecuteRequestBody {
  agentId: string
  input: string
  userId?: string
  metadata?: Record<string, any>
}

export async function POST(request: Request) {
  try {
    const body: ExecuteRequestBody = await request.json()
    const { agentId, input, userId = "admin", metadata } = body

    if (!agentId || !input) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent ID and input are required",
        },
        { status: 400 },
      )
    }

    // Verify agent exists
    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent not found",
        },
        { status: 404 },
      )
    }

    // Create and execute task
    const task = await executionPipeline.createTask(agentId, userId, input, metadata)
    await executionPipeline.executeTask(task.id)

    // Get updated task with results
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: completedTask, error } = await supabase.from("agent_tasks").select("*").eq("id", task.id).single()

    if (error) {
      throw new Error("Failed to retrieve task results")
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: completedTask.id,
        status: completedTask.status,
        output: completedTask.output,
        metadata: completedTask.metadata,
        agent: {
          id: agent.id,
          name: agent.name,
          category: agent.category,
        },
      },
    })
  } catch (error) {
    console.error("Agent execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 },
    )
  }
}

// Get task status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: "Task ID is required",
        },
        { status: 400 },
      )
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: task, error } = await supabase.from("agent_tasks").select("*").eq("id", taskId).single()

    if (error || !task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        status: task.status,
        input: task.input,
        output: task.output,
        metadata: task.metadata,
        created_at: task.created_at,
        updated_at: task.updated_at,
      },
    })
  } catch (error) {
    console.error("Task status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get task status",
      },
      { status: 500 },
    )
  }
}
