"use client"

import { useState, useEffect, useCallback } from "react"

interface DashboardStats {
  totalChats: number
  activeAgents: number
  successRate: number
  avgResponseTime: number
}

interface SystemHealth {
  aiProviders: {
    openai: boolean
    xai: boolean
    groq: boolean
  }
  database: boolean
  googleIntegrations: boolean
}

interface TopAgent {
  id: string
  name: string
  usage: number
  successRate: number
}

interface RecentActivity {
  id: string
  title: string
  description: string
  status: "success" | "error" | "pending"
  timestamp: string
}

interface DashboardData {
  stats: DashboardStats
  systemHealth: SystemHealth
  topAgents: TopAgent[]
  recentActivity: RecentActivity[]
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard data from multiple endpoints
      const [statsRes, healthRes, activityRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/ai-status"),
        fetch("/api/activity"),
      ])

      const [statsData, healthData, activityData] = await Promise.all([
        statsRes.json(),
        healthRes.json(),
        activityRes.json(),
      ])

      // Mock data for demonstration
      const dashboardData: DashboardData = {
        stats: {
          totalChats: statsData.success ? statsData.data.totalChats || 1247 : 1247,
          activeAgents: 6,
          successRate: 98.5,
          avgResponseTime: 1.2,
        },
        systemHealth: {
          aiProviders: {
            openai: healthData.success ? healthData.data?.ai?.providers?.openai || false : false,
            xai: healthData.success ? healthData.data?.ai?.providers?.xai || false : false,
            groq: healthData.success ? healthData.data?.ai?.providers?.groq || false : false,
          },
          database: true,
          googleIntegrations: healthData.success ? healthData.data?.google?.status?.hasAnyAuth || false : false,
        },
        topAgents: [
          { id: "surplus-funds-specialist", name: "Surplus Funds Specialist", usage: 85, successRate: 99.2 },
          { id: "credit-repair-expert", name: "Credit Repair Expert", usage: 72, successRate: 97.8 },
          { id: "manifesting-specialist", name: "Manifesting Specialist", usage: 68, successRate: 98.9 },
          { id: "greatness-coach", name: "Greatness Coach", usage: 61, successRate: 99.1 },
          { id: "debt-collection-advisor", name: "Debt Collection Advisor", usage: 54, successRate: 96.7 },
        ],
        recentActivity: activityData.success
          ? activityData.data || []
          : [
              {
                id: "1",
                title: "New chat session started",
                description: "Surplus Funds Specialist engaged for property research",
                status: "success" as const,
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              },
              {
                id: "2",
                title: "Credit report analysis completed",
                description: "Generated dispute letters for 3 negative items",
                status: "success" as const,
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              },
              {
                id: "3",
                title: "Manifestation plan created",
                description: "90-day career advancement strategy developed",
                status: "success" as const,
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              },
              {
                id: "4",
                title: "Google Drive integration test",
                description: "Successfully uploaded contract documents",
                status: "success" as const,
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              },
              {
                id: "5",
                title: "System health check",
                description: "All AI providers operational",
                status: "success" as const,
                timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
            ],
      }

      setData(dashboardData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch dashboard data"
      setError(errorMessage)
      console.error("Dashboard data fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refreshData,
  }
}
