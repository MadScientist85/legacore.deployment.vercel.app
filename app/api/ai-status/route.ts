import { NextResponse } from "next/server"
import { aiRouter } from "@/lib/ai-router"
import { validateEnvironment } from "@/lib/env-validator"

export async function GET() {
  try {
    // Get comprehensive validation results
    const validation = validateEnvironment()
    const routerStatus = aiRouter.getStatus()

    // Determine current active model
    let currentModel = "No active provider"
    let currentProvider = "none"

    if (validation.hasAnyProvider) {
      const activeProvider = Object.entries(validation.providers).find(
        ([_, config]) => config.hasValidKey && config.status === "active",
      )

      if (activeProvider) {
        const [providerName, config] = activeProvider
        currentProvider = providerName
        currentModel = `${config.model} via ${providerName.toUpperCase()}`
      } else {
        // Check for fallback providers
        const fallbackProvider = Object.entries(validation.providers).find(
          ([_, config]) => config.hasValidKey && config.status === "fallback",
        )

        if (fallbackProvider) {
          const [providerName, config] = fallbackProvider
          currentProvider = providerName
          currentModel = `${config.model} via ${providerName.toUpperCase()} (Fallback)`
        }
      }
    }

    // Generate status summary for UI
    const providerSummary = Object.entries(validation.providers).map(([name, config]) => ({
      name: name.toUpperCase(),
      enabled: config.enabled,
      status: config.hasValidKey
        ? config.status === "active"
          ? "Valid"
          : config.status === "fallback"
            ? "Using Fallback"
            : "Error"
        : "No Key",
      model: config.model || "N/A",
      keySource: config.keySource,
      statusColor: config.hasValidKey
        ? config.status === "active"
          ? "green"
          : config.status === "fallback"
            ? "yellow"
            : "red"
        : "red",
    }))

    return NextResponse.json({
      success: true,
      data: {
        system: {
          status: validation.hasAnyProvider ? "healthy" : "degraded",
          timestamp: new Date().toISOString(),
          currentProvider,
          currentModel,
        },
        providers: providerSummary,
        validation: {
          hasAnyProvider: validation.hasAnyProvider,
          recommendedProvider: validation.recommendedProvider,
          errors: validation.errors,
          warnings: validation.warnings,
        },
        router: {
          activeProviders: routerStatus.activeProviders,
          fallbackActive: validation.warnings.length > 0,
        },
      },
    })
  } catch (error) {
    console.error("AI Status API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Status check failed",
        data: {
          system: {
            status: "error",
            timestamp: new Date().toISOString(),
            currentProvider: "none",
            currentModel: "Error checking status",
          },
          providers: [],
          validation: {
            hasAnyProvider: false,
            recommendedProvider: "none",
            errors: ["Failed to validate environment"],
            warnings: [],
          },
        },
      },
      { status: 500 },
    )
  }
}
