import { NextResponse } from "next/server"
import { getAnalyticsConfig, isAnalyticsEnabled } from "@/lib/analytics-config"
import { getSegmentStatus } from "@/lib/env-validator"

export async function GET() {
  try {
    const config = getAnalyticsConfig()
    const segmentStatus = getSegmentStatus()
    const isEnabled = isAnalyticsEnabled()

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        segment: {
          status: segmentStatus.status,
          hasValidKey: segmentStatus.hasValidKey,
          keySource: segmentStatus.keySource,
          config: {
            flushAt: config.segment.flushAt,
            flushInterval: config.segment.flushInterval,
            debug: config.segment.debug,
          },
        },
        tracking: config.tracking,
        privacy: config.privacy,
        environment: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("Analytics config API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get analytics config",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()

    // In a real implementation, you would:
    // 1. Validate the updates
    // 2. Update configuration in database or environment
    // 3. Apply changes to analytics service

    return NextResponse.json({
      success: true,
      message: "Analytics configuration updated",
      data: updates,
    })
  } catch (error) {
    console.error("Analytics config update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update analytics config",
      },
      { status: 500 },
    )
  }
}
