import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/google"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.json({ success: false, error: `Google OAuth error: ${error}` }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({ success: false, error: "No authorization code provided" }, { status: 400 })
    }

    const result = await exchangeCodeForTokens(code)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Redirect to success page or close popup
    return NextResponse.redirect(new URL("/google-auth-success", request.url))
  } catch (error) {
    console.error("Google callback error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "OAuth callback failed",
      },
      { status: 500 },
    )
  }
}
