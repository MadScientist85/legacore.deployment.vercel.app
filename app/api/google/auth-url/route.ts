import { NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/lib/google"

export async function GET() {
  try {
    const result = await getGoogleAuthUrl()

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      authUrl: result.url,
    })
  } catch (error) {
    console.error("Google auth URL error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate auth URL",
      },
      { status: 500 },
    )
  }
}
