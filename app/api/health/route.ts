import { NextResponse } from "next/server"

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        api: "operational",
        database: "checking...",
        ai_providers: "checking...",
      },
    }

    // Quick health checks
    try {
      // Check if we can make a simple database query
      const { testSupabaseConnection } = await import("@/lib/supabase")
      const dbTest = await testSupabaseConnection()
      health.services.database = dbTest.success ? "operational" : "degraded"
    } catch (error) {
      health.services.database = "unavailable"
    }

    try {
      // Check AI providers
      const { aiRouter } = await import("@/lib/ai-router")
      const aiStatus = aiRouter.getProviderStatus()
      const hasAnyProvider = Object.values(aiStatus).some(Boolean)
      health.services.ai_providers = hasAnyProvider ? "operational" : "unavailable"
    } catch (error) {
      health.services.ai_providers = "unavailable"
    }

    return NextResponse.json({
      success: true,
      data: health,
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
