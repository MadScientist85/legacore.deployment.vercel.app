"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Settings, Shield, Zap, Globe, Key } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface AIStatus {
  system: {
    status: string
    currentProvider: string
    currentModel: string
    timestamp: string
  }
  providers: Array<{
    name: string
    enabled: boolean
    status: string
    model: string
    keySource: string
    statusColor: string
  }>
  validation: {
    hasAnyProvider: boolean
    recommendedProvider: string
    errors: string[]
    warnings: string[]
  }
  router: {
    activeProviders: Array<{
      name: string
      status: string
      model: string
      keySource: string
    }>
    fallbackActive: boolean
  }
}

export default function SettingsPage() {
  const [aiStatus, setAiStatus] = React.useState<AIStatus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchAIStatus = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/ai-status")
      const data = await response.json()
      if (data.success) {
        setAiStatus(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch AI status:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchAIStatus()
  }, [])

  const getStatusIcon = (status: string, color: string) => {
    switch (color) {
      case "green":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "yellow":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "red":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getProviderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "openai":
        return <Zap className="h-4 w-4" />
      case "groq":
        return <Zap className="h-4 w-4" />
      case "xai":
        return <Shield className="h-4 w-4" />
      case "openrouter":
        return <Globe className="h-4 w-4" />
      default:
        return <Key className="h-4 w-4" />
    }
  }

  const getKeySourceBadge = (keySource: string) => {
    const variants = {
      vercel: "default",
      primary: "secondary",
      fallback: "outline",
      none: "destructive",
    } as const

    return (
      <Badge variant={variants[keySource as keyof typeof variants] || "secondary"}>
        {keySource === "vercel"
          ? "Vercel Env"
          : keySource === "primary"
            ? "Primary"
            : keySource === "fallback"
              ? "Fallback"
              : "No Key"}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-lg font-semibold">System Settings</h1>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={fetchAIStatus} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>Current system status and active AI provider configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {aiStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">System Status</div>
                      <Badge
                        variant={aiStatus.system.status === "healthy" ? "default" : "destructive"}
                        className="w-fit"
                      >
                        {aiStatus.system.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Active Provider</div>
                      <div className="text-sm text-muted-foreground">
                        {aiStatus.system.currentProvider.toUpperCase()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Current Model</div>
                      <div className="text-sm text-muted-foreground">{aiStatus.system.currentModel}</div>
                    </div>
                  </div>

                  {aiStatus.validation.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Fallback Active:</strong> {aiStatus.validation.warnings.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {aiStatus.validation.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Configuration Errors:</strong> {aiStatus.validation.errors.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Failed to load system status</div>
              )}
            </CardContent>
          </Card>

          {/* AI Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Provider Status
              </CardTitle>
              <CardDescription>
                Configuration and status of all AI providers with fallback chain priority
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiStatus ? (
                <div className="space-y-4">
                  {aiStatus.providers.map((provider, index) => (
                    <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(provider.status, provider.statusColor)}
                          {getProviderIcon(provider.name)}
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {provider.model || "No model configured"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getKeySourceBadge(provider.keySource)}
                        <Badge
                          variant={
                            provider.status === "Valid"
                              ? "default"
                              : provider.status === "Using Fallback"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {provider.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">Priority: {index + 1}</div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Fallback Chain Priority</div>
                    <div className="text-sm text-muted-foreground">
                      1. Vercel Environment Variables → 2. Primary API Keys → 3. Fallback Keys → 4. Mock Response
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Failed to load provider status</div>
              )}
            </CardContent>
          </Card>

          {/* Active Providers */}
          {aiStatus?.router.activeProviders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Providers</CardTitle>
                <CardDescription>Currently available providers in the AI router</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiStatus.router.activeProviders.map((provider) => (
                    <div key={provider.name} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{provider.name.toUpperCase()}</div>
                        <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                          {provider.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Model: {provider.model}</div>
                      <div className="text-sm text-muted-foreground">Key Source: {provider.keySource}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>Required environment variables for AI provider integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Primary Keys</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• OPENAI_API_KEY</li>
                      <li>• GROQ_API_KEY</li>
                      <li>• XAI_API_KEY / GROK_API_KEY</li>
                      <li>• OPENROUTER_API_KEY</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Vercel Environment</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• OPENAI_API_KEY_VERCEL</li>
                      <li>• GROQ_API_KEY_VERCEL</li>
                      <li>• XAI_API_KEY_VERCEL</li>
                      <li>• OPENROUTER_API_KEY_VERCEL</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <div className="font-medium mb-2">Configuration Notes</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Vercel environment variables take highest priority</li>
                    <li>• Fallback keys are used when primary keys fail</li>
                    <li>• OpenRouter provides access to open-source models</li>
                    <li>• Set XAI_ENABLED=false to disable xAI/Grok when credits are low</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
