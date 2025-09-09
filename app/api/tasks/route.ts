import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    const { data: tasks, error } = await dbOperations.getTasks()

    if (error) {
      console.error("Tasks query error:", error)
    }

    // Filter by agent if specified
    const filteredTasks = agentId ? (tasks || []).filter((task) => task.agent_id === agentId) : tasks || []

    return NextResponse.json({
      success: true,
      data: filteredTasks,
    })
  } catch (error) {
    console.error("Get tasks API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch tasks",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()

    // Validate required fields
    const requiredFields = ["agent_id", "title", "description"]
    for (const field of requiredFields) {
      if (!taskData[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Set default values
    const task = {
      ...taskData,
      status: taskData.status || "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: createdTask, error } = await dbOperations.createTask(task)

    if (error) {
      console.error("Create task error:", error)
      return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        data: createdTask,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create task API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task",
      },
      { status: 500 },
    )
  }
}
