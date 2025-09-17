"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useSegmentTracking } from "@/hooks/use-segment-tracking"
import { Activity, Bot, CheckCircle, Clock, MessageSquare, TrendingUp, Zap, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export function Dashboard() {
  const { data, loading, error, refreshData } = useDashboardData()

  const { trackFeatureUsage, trackPageView } = useSegmentTracking()

  React.useEffect(() => {
    trackPageView({
      page: "Dashboard",
      title: "LEGACORE™ Command Center",
    })
  }, [trackPageView])

  const handleRefreshData = async () => {
    await trackFeatureUsage({
      feature: "dashboard",
      action: "refresh_data",
    })
    refreshData()
  }

  const handleQuickAction = (action: string, path: string) => {
    trackFeatureUsage({
      feature: "dashboard",
      action: "quick_action",
      metadata: { action_type: action, destination: path },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefreshData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { stats, recentActivity, topAgents, systemHealth } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LEGACORE™ Command Center</h1>
          <p className="text-muted-foreground">Tactical AI Operations Dashboard</p>
        </div>
        <Button onClick={handleRefreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground">-0.3s improvement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Providers</span>
                <div className="flex gap-1">
                  {Object.entries(systemHealth.aiProviders).map(([provider, status]) => (
                    <div
                      key={provider}
                      className={`w-3 h-3 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`}
                      title={`${provider}: ${status ? "Online" : "Offline"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant={systemHealth.database ? "default" : "destructive"}>
                  {systemHealth.database ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Google Integrations</span>
                <Badge variant={systemHealth.googleIntegrations ? "default" : "secondary"}>
                  {systemHealth.googleIntegrations ? "Connected" : "Not Configured"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.usage} className="h-1 flex-1" />
                      <span className="text-xs text-muted-foreground">{agent.usage}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.successRate}%
                  </Badge>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Link href="/agents">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View All Agents
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Link href="/activity">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View All Activity
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/chat" onClick={() => handleQuickAction("start_chat", "/chat")}>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </Link>
            <Link href="/agents" onClick={() => handleQuickAction("manage_agents", "/agents")}>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Bot className="h-4 w-4 mr-2" />
                Manage Agents
              </Button>
            </Link>
            <Link href="/admin" onClick={() => handleQuickAction("system_admin", "/admin")}>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Activity className="h-4 w-4 mr-2" />
                System Admin
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Named export
export { Dashboard as default }
