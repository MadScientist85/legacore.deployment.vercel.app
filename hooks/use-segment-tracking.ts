"use client"

import { useCallback } from "react"

// Client-side tracking functions that call API routes
export const useSegmentTracking = () => {
  const trackEvent = useCallback(
    async (eventData: {
      event: string
      properties?: Record<string, any>
      userId?: string
    }) => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        })
      } catch (error) {
        console.error("[LEGACORE] Client tracking error:", error)
      }
    },
    [],
  )

  const trackPageView = useCallback(
    async (pageData: {
      page: string
      title?: string
      userId?: string
    }) => {
      try {
        await fetch("/api/analytics/page", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pageData),
        })
      } catch (error) {
        console.error("[LEGACORE] Page tracking error:", error)
      }
    },
    [],
  )

  const trackAgentInteraction = useCallback(
    async (data: {
      agentId: string
      agentName: string
      action: "create" | "run" | "complete" | "error"
      duration?: number
      category?: string
      userId?: string
    }) => {
      return trackEvent({
        event: "Agent Interaction",
        properties: {
          agent_id: data.agentId,
          agent_name: data.agentName,
          action: data.action,
          duration_ms: data.duration,
          category: data.category,
          platform: "LEGACORE",
        },
        userId: data.userId,
      })
    },
    [trackEvent],
  )

  const trackChatMessage = useCallback(
    async (data: {
      agentId?: string
      agentName?: string
      messageLength: number
      responseTime?: number
      userId?: string
    }) => {
      return trackEvent({
        event: "Chat Message",
        properties: {
          agent_id: data.agentId,
          agent_name: data.agentName,
          message_length: data.messageLength,
          response_time_ms: data.responseTime,
          platform: "LEGACORE",
        },
        userId: data.userId,
      })
    },
    [trackEvent],
  )

  const trackFeatureUsage = useCallback(
    async (data: {
      feature: string
      action: string
      metadata?: Record<string, any>
      userId?: string
    }) => {
      return trackEvent({
        event: "Feature Usage",
        properties: {
          feature: data.feature,
          action: data.action,
          platform: "LEGACORE",
          ...data.metadata,
        },
        userId: data.userId,
      })
    },
    [trackEvent],
  )

  return {
    trackEvent,
    trackPageView,
    trackAgentInteraction,
    trackChatMessage,
    trackFeatureUsage,
  }
}
