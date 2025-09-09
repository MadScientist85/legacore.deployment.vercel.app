"use client"

import { useState, useEffect, useCallback } from "react"
import { defaultAgents, type AgentConfig } from "@/lib/agents.config"

export interface AgentWithStats extends AgentConfig {
  status: "online" | "busy" | "offline"
  usage: number
  successRate: number
}

interface AgentStats {
  totalConversations?: number
  avgResponseTime?: number
  successRate?: number
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from API first, fallback to default config
      let agentData: AgentConfig[] = defaultAgents

      try {
        const response = await fetch("/api/agents")
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            agentData = result.data
          }
        }
      } catch (apiError) {
        console.warn("API fetch failed, using default agents:", apiError)
      }

      // Add mock stats to agents
      const agentsWithStats: AgentWithStats[] = agentData.map((agent, index) => ({
        ...agent,
        status: agent.active ? ("online" as const) : ("offline" as const),
        usage: Math.floor(Math.random() * 100) + 20, // Mock usage data
        successRate: Math.floor(Math.random() * 10) + 90, // Mock success rate 90-100%
      }))

      setAgents(agentsWithStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch agents"
      setError(errorMessage)
      console.error("Agents fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleAgentStatus = useCallback(
    async (agentId: string) => {
      try {
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  active: !agent.active,
                  status: !agent.active ? ("online" as const) : ("offline" as const),
                }
              : agent,
          ),
        )

        // Try to update via API
        try {
          await fetch(`/api/agents/${agentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !agents.find((a) => a.id === agentId)?.active }),
          })
        } catch (apiError) {
          console.warn("Failed to update agent status via API:", apiError)
        }
      } catch (err) {
        console.error("Failed to toggle agent status:", err)
      }
    },
    [agents],
  )

  const getAgentStats = useCallback(
    (agentId: string): AgentStats | null => {
      const agent = agents.find((a) => a.id === agentId)
      if (!agent) return null

      return {
        totalConversations: agent.usage,
        avgResponseTime: 1.2,
        successRate: agent.successRate,
      }
    },
    [agents],
  )

  const categories = ["all", ...Array.from(new Set(agents.map((agent) => agent.category)))]

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    loading,
    error,
    categories,
    toggleAgentStatus,
    getAgentStats,
    refreshAgents: fetchAgents,
  }
}
