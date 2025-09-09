import { NextResponse } from "next/server"
import { dbOperations } from "@/lib/supabase"
import { defaultAgents } from "@/lib/agents.config"

export async function GET() {
  try {
    // Try to get agents from database first
    const { data: dbAgents, error } = await dbOperations.getAgents()

    if (error) {
      console.warn("Database error, using default agents:", error)
      return NextResponse.json({
        success: true,
        data: defaultAgents,
        source: "default",
      })
    }

    // If database returns empty or null, use default agents
    const agents = Array.isArray(dbAgents) && dbAgents.length > 0 ? dbAgents : defaultAgents

    return NextResponse.json({
      success: true,
      data: agents,
      source: dbAgents && dbAgents.length > 0 ? "database" : "default",
    })
  } catch (error) {
    console.error("API error:", error)

    // Always return default agents as fallback
    return NextResponse.json({
      success: true,
      data: defaultAgents,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, description, category",
        },
        { status: 400 },
      )
    }

    // For now, return success without actually creating (since we're using default agents)
    return NextResponse.json({
      success: true,
      message: "Agent creation not implemented yet",
      data: body,
    })
  } catch (error) {
    console.error("POST /api/agents error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
