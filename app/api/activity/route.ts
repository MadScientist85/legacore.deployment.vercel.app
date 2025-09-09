import { NextResponse } from "next/server"
import { dbOperations } from "@/lib/supabase"

export async function GET() {
  try {
    // Try to get recent activity from database
    const { data: activities, error } = (await dbOperations.getRecentActivity?.(10)) || { data: null, error: null }

    if (error) {
      console.error("Activity query error:", error)
    }

    // Fallback to mock data if database is not available
    const fallbackActivities = [
      {
        id: "1",
        type: "system",
        title: "System Initialized",
        description: "LEGACORE platform started successfully",
        created_at: new Date().toISOString(),
        metadata: { status: "success" },
      },
      {
        id: "2",
        type: "agent",
        title: "Agents Loaded",
        description: "6 specialized agents ready for deployment",
        created_at: new Date(Date.now() - 300000).toISOString(),
        metadata: { status: "success" },
      },
      {
        id: "3",
        type: "chat",
        title: "Chat Session Started",
        description: "New conversation with Manifesting Specialist",
        created_at: new Date(Date.now() - 600000).toISOString(),
        metadata: { status: "success" },
      },
      {
        id: "4",
        type: "task",
        title: "Task Completed",
        description: "Credit report analysis completed successfully",
        created_at: new Date(Date.now() - 900000).toISOString(),
        metadata: { status: "success" },
      },
      {
        id: "5",
        type: "system",
        title: "Health Check",
        description: "All systems operational",
        created_at: new Date(Date.now() - 1200000).toISOString(),
        metadata: { status: "success" },
      },
    ]

    return NextResponse.json({
      success: true,
      data: activities || fallbackActivities,
    })
  } catch (error) {
    console.error("Activity API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch activity",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const activityData = await request.json()

    // Validate required fields
    const requiredFields = ["type", "title", "description"]
    for (const field of requiredFields) {
      if (!activityData[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Log activity to database
    const { data: activity, error } = (await dbOperations.logActivity?.(activityData)) || { data: null, error: null }

    if (error) {
      console.error("Log activity error:", error)
    }

    return NextResponse.json({
      success: true,
      data: activity || { id: Date.now().toString(), ...activityData, created_at: new Date().toISOString() },
    })
  } catch (error) {
    console.error("Log activity API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to log activity",
      },
      { status: 500 },
    )
  }
}
