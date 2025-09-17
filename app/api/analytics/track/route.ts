import { type NextRequest, NextResponse } from "next/server"
import analytics from "@/lib/segment"

export async function POST(request: NextRequest) {
  try {
    const { event, properties, userId } = await request.json()

    if (!event) {
      return NextResponse.json({ success: false, error: "Event name is required" }, { status: 400 })
    }

    await analytics.track({
      userId: userId || "anonymous",
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: "LEGACORE",
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LEGACORE] Analytics tracking error:", error)
    return NextResponse.json({ success: false, error: "Failed to track event" }, { status: 500 })
  }
}
