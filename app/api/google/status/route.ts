import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Google integrations are configured
    const oauth2Configured = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
    )

    const serviceAccountConfigured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
    )

    return NextResponse.json({
      success: true,
      data: {
        oauth2Configured,
        serviceAccountConfigured,
        hasAnyAuth: oauth2Configured || serviceAccountConfigured,
        connected: false, // This would be determined by checking stored tokens
      },
    })
  } catch (error) {
    console.error("Google status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check Google status",
      },
      { status: 500 },
    )
  }
}
