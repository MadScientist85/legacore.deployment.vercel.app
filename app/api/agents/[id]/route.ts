import { type NextRequest, NextResponse } from "next/server"
import { getAgentById } from "@/lib/agents.config"
import { dbOperations } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Try to get from database first, fallback to config
    const { data: dbAgent, error } = await dbOperations.getAgentById(id)

    if (error) {
      console.error("Database agent query error:", error)
    }

    const agent = dbAgent || getAgentById(id)

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: agent,
    })
  } catch (error) {
    console.error("Get agent API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch agent",
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
    const allowedUpdates = ["active", "name", "description", "systemPrompt"]
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid updates provided" }, { status: 400 })
    }

    // Update in database (if available)
    const { data: updatedAgent, error } = (await dbOperations.updateAgent?.(id, filteredUpdates)) || {
      data: null,
      error: null,
    }

    if (error) {
      console.error("Database agent update error:", error)
      return NextResponse.json({ success: false, error: "Failed to update agent in database" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedAgent || { id, ...filteredUpdates },
    })
  } catch (error) {
    console.error("Update agent API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update agent",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Soft delete by setting active to false
    const { data: updatedAgent, error } = (await dbOperations.updateAgent?.(id, { active: false })) || {
      data: null,
      error: null,
    }

    if (error) {
      console.error("Database agent delete error:", error)
      return NextResponse.json({ success: false, error: "Failed to delete agent" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Agent deactivated successfully",
    })
  } catch (error) {
    console.error("Delete agent API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete agent",
      },
      { status: 500 },
    )
  }
}
