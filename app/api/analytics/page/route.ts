import { type NextRequest, NextResponse } from "next/server"
import analytics from "@/lib/segment"

export async function POST(request: NextRequest) {
  try {
    const { page, title, userId } = await request.json()

    if (!page) {
      return NextResponse.json({ success: false, error: "Page name is required" }, { status: 400 })
    }

    await analytics.page({
      userId: userId || "anonymous",
      name: page,
      properties: {
        title,
        url: request.url,
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
    console.error("[LEGACORE] Page tracking error:", error)
    return NextResponse.json({ success: false, error: "Failed to track page view" }, { status: 500 })
  }
}
