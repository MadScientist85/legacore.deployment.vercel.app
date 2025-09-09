import { NextResponse } from "next/server"
import { dbOperations } from "@/lib/supabase"

export async function GET() {
  try {
    // Get analytics data from database or return mock data
    const analytics = await dbOperations.getAnalytics()

    if (analytics.error) {
      console.error("Analytics query error:", analytics.error)
    }

    return NextResponse.json({
      success: true,
      data: analytics.data || {
        totalChats: 45,
        activeAgents: 6,
        completedTasks: 23,
        successRate: 95.5,
        avgResponseTime: 1.2,
        topAgents: [
          {
            id: "manifesting-specialist",
            name: "Manifesting Specialist",
            category: "personal-development",
            usage: 25,
            successRate: 98,
          },
          {
            id: "credit-repair-expert",
            name: "Credit Repair Expert",
            category: "credit-repair",
            usage: 22,
            successRate: 96,
          },
          {
            id: "surplus-funds-specialist",
            name: "Surplus Funds Specialist",
            category: "surplus-funds",
            usage: 18,
            successRate: 94,
          },
        ],
      },
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 },
    )
  }
}
