"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Activity, AlertCircle, CheckCircle, RefreshCw, Zap, Database, Bot, Cloud } from "lucide-react"

interface AIProviderStatus {
  openai: boolean
  xai: boolean
  groq: boolean
  hasAnyProvider: boolean
}

interface GoogleStatus {
  oauth2Configured: boolean
  serviceAccountConfigured: boolean
  hasAnyAuth: boolean
}

interface SystemStatus {
  ai: {
    providers: AIProviderStatus
    hasAnyProvider: boolean
  }
  google: {
    status: GoogleStatus
    connectionTest: {
      success: boolean
      services: string[]
      error?: string
    }
  }
  system: {
    status: string
    timestamp: string
  }
}

export function AIStatusMonitor() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/ai-status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch status")
      }

      setStatus(data.data)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch system status"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return "🤖"
      case "xai":
        return "🧠"
      case "groq":
        return "⚡"
      default:
        return "🔧"
    }
  }

  const getHealthScore = () => {
    if (!status) return 0

    let score = 0
    const total = 10

    // AI Providers (40% weight)
    if (status.ai.providers.openai) score += 2
    if (status.ai.providers.xai) score += 1
    if (status.ai.providers.groq) score += 1

    // Google Integration (20% weight)
    if (status.google.status.hasAnyAuth) score += 2

    // System Health (40% weight)
    if (status.system.status === "healthy") score += 4

    return Math.round((score / total) * 100)
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600", variant: "default" as const }
    if (score >= 60) return { label: "Good", color: "text-blue-600", variant: "secondary" as const }
    if (score >= 40) return { label: "Fair", color: "text-yellow-600", variant: "outline" as const }
    return { label: "Poor", color: "text-red-600", variant: "destructive" as const }
  }

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            System Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  const healthScore = getHealthScore()
  const healthStatus = getHealthStatus(healthScore)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Real-time monitoring of AI providers and integrations</CardDescription>
          </div>
          <Button onClick={fetchStatus} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Health */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Health</span>
            <Badge variant={healthStatus.variant} className={healthStatus.color}>
              {healthStatus.label}
            </Badge>
          </div>
          <Progress value={healthScore} className="h-2" />
          <p className="text-xs text-muted-foreground">System health score: {healthScore}%</p>
        </div>

        <Separator />

        {/* AI Providers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="font-medium">AI Providers</span>
            <Badge variant={status.ai.hasAnyProvider ? "default" : "destructive"}>
              {Object.values(status.ai.providers).filter(Boolean).length} Active
            </Badge>
          </div>

          <div className="grid gap-2">
            {Object.entries(status.ai.providers).map(([provider, isActive]) => {
              if (provider === "hasAnyProvider") return null

              return (
                <div key={provider} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(provider)}</span>
                    <span className="text-sm capitalize">{provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Online" : "Offline"}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Google Integrations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span className="font-medium">Google Integrations</span>
            <Badge variant={status.google.status.hasAnyAuth ? "default" : "secondary"}>
              {status.google.status.hasAnyAuth ? "Configured" : "Not Configured"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">OAuth2</span>
              <Badge variant={status.google.status.oauth2Configured ? "default" : "secondary"}>
                {status.google.status.oauth2Configured ? "Ready" : "Not Set"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Service Account</span>
              <Badge variant={status.google.status.serviceAccountConfigured ? "default" : "secondary"}>
                {status.google.status.serviceAccountConfigured ? "Ready" : "Not Set"}
              </Badge>
            </div>

            {status.google.connectionTest.success && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Connected Services</span>
                <div className="flex gap-1">
                  {status.google.connectionTest.services.map((service) => (
                    <Badge key={service} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* System Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium">System</span>
            <Badge variant={status.system.status === "healthy" ? "default" : "destructive"}>
              {status.system.status}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Last Updated: {lastUpdated?.toLocaleTimeString() || "Never"}</p>
            <p>System Time: {new Date(status.system.timestamp).toLocaleString()}</p>
          </div>
        </div>

        {/* Recommendations */}
        {healthScore < 80 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-600">Recommendations</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {!status.ai.hasAnyProvider && <p>• Configure at least one AI provider (OpenAI, xAI, or Groq)</p>}
                {!status.google.status.hasAnyAuth && <p>• Set up Google integrations for enhanced functionality</p>}
                {status.system.status !== "healthy" && <p>• Check system logs for potential issues</p>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Named export
export { AIStatusMonitor as default }
