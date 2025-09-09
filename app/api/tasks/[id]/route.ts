import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: task, error } = (await dbOperations.getTaskById?.(id)) || { data: null, error: "Task not found" }

    if (error || !task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Get task API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch task",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updates = await request.json()

    // Validate updates
    const allowedUpdates = ["title", "description", "status", "input_data", "output_data"]
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid updates provided" }, { status: 400 })
    }

    // Add completion timestamp if status is being set to completed
    if (filteredUpdates.status === "completed") {
      filteredUpdates.completed_at = new Date().toISOString()
    }

    const { data: updatedTask, error } = await dbOperations.updateTask(id, filteredUpdates)

    if (error) {
      console.error("Update task error:", error)
      return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    })
  } catch (error) {
    console.error("Update task API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update task",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = (await dbOperations.deleteTask?.(id)) || { error: "Delete not implemented" }

    if (error) {
      console.error("Delete task error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete task",
      },
      { status: 500 },
    )
  }
}
