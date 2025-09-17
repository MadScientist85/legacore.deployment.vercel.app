"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Activity, Users, MessageSquare, Bot, Clock, Target, RefreshCw, Download } from "lucide-react"
import { useSegmentTracking } from "@/hooks/use-segment-tracking"

interface AnalyticsData {
  overview: {
    totalEvents: number
    totalUsers: number
    totalSessions: number
    avgSessionDuration: number
    topEvents: Array<{ name: string; count: number }>
  }
  agentMetrics: {
    totalInteractions: number
    avgResponseTime: number
    successRate: number
    topAgents: Array<{
      id: string
      name: string
      interactions: number
      successRate: number
      avgResponseTime: number
      category: string
    }>
  }
  userBehavior: {
    dailyActiveUsers: Array<{ date: string; users: number }>
    featureUsage: Array<{ feature: string; usage: number; growth: number }>
    sessionFlow: Array<{ step: string; users: number; dropoff: number }>
  }
  performance: {
    responseTimeDistribution: Array<{ range: string; count: number }>
    errorRates: Array<{ date: string; errors: number; total: number }>
    systemHealth: {
      uptime: number
      avgResponseTime: number
      errorRate: number
    }
  }
}

const COLORS = ["#00BFFF", "#D4AF37", "#32CD32", "#FF6347", "#9370DB", "#20B2AA"]

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("7d")
  const [activeTab, setActiveTab] = useState("overview")

  const { trackFeatureUsage, trackPageView } = useSegmentTracking()

  useEffect(() => {
    trackPageView({
      page: "Analytics Dashboard",
      title: "LEGACORE™ Analytics",
    })
  }, [trackPageView])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulate API call - replace with actual Segment API integration
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`)

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const result = await response.json()
      setData(result.data)

      trackFeatureUsage({
        feature: "analytics",
        action: "fetch_data",
        metadata: { time_range: timeRange },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const handleExportData = () => {
    trackFeatureUsage({
      feature: "analytics",
      action: "export_data",
      metadata: { time_range: timeRange, tab: activeTab },
    })
    // Implement export functionality
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
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Analytics Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into LEGACORE™ platform usage</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+22% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.overview.avgSessionDuration / 60)}m</div>
            <p className="text-xs text-muted-foreground">+5% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="users">User Behavior</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>Most frequent user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.overview.topEvents}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00BFFF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>User engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.userBehavior.dailyActiveUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#00BFFF" fill="#00BFFF" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Agent Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agent Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Interactions</span>
                  <span className="font-bold">{data.agentMetrics.totalInteractions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="font-bold">{data.agentMetrics.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-bold text-green-600">{data.agentMetrics.successRate}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Agents Performance */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Performing Agents</CardTitle>
                <CardDescription>Agent usage and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.agentMetrics.topAgents.map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{agent.name}</h4>
                          <Badge variant="outline">{agent.category}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="block font-medium text-foreground">{agent.interactions}</span>
                            <span>Interactions</span>
                          </div>
                          <div>
                            <span className="block font-medium text-green-600">{agent.successRate}%</span>
                            <span>Success Rate</span>
                          </div>
                          <div>
                            <span className="block font-medium text-foreground">{agent.avgResponseTime}ms</span>
                            <span>Avg Response</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most popular platform features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.userBehavior.featureUsage.map((feature, index) => (
                    <div key={feature.feature} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{feature.feature}</span>
                        <div className="flex items-center gap-2">
                          <span>{feature.usage}%</span>
                          <Badge variant={feature.growth > 0 ? "default" : "secondary"} className="text-xs">
                            {feature.growth > 0 ? "+" : ""}
                            {feature.growth}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={feature.usage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Session Flow */}
            <Card>
              <CardHeader>
                <CardTitle>Session Flow</CardTitle>
                <CardDescription>User journey through the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.userBehavior.sessionFlow} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="step" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#00BFFF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="font-bold text-green-600">{data.performance.systemHealth.uptime}%</span>
                  </div>
                  <Progress value={data.performance.systemHealth.uptime} className="h-2" />

                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-bold">{data.performance.systemHealth.avgResponseTime}ms</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-bold text-red-600">{data.performance.systemHealth.errorRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Distribution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Distribution of API response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.performance.responseTimeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.performance.responseTimeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Rates Over Time */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Error Rates Over Time</CardTitle>
                <CardDescription>System error trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.performance.errorRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="errors" stroke="#FF6347" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#00BFFF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Named export
export { AnalyticsDashboard as default }
