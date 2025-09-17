import { Analytics } from "@segment/analytics-node"

// Initialize Segment client
const analytics = new Analytics({
  writeKey: process.env.SEGMENT_WRITE_KEY || "",
  flushAt: 1,
  flushInterval: 1000,
})

// Event types for LEGACORE operations
export interface LegacoreEvent {
  userId?: string
  event: string
  properties?: Record<string, any>
  context?: Record<string, any>
}

// Track AI agent interactions
export const trackAgentInteraction = async (data: {
  agentId: string
  agentName: string
  userId?: string
  action: "create" | "run" | "complete" | "error"
  duration?: number
  tokens?: number
  model?: string
  category?: string
}) => {
  try {
    await analytics.track({
      userId: data.userId || "anonymous",
      event: "Agent Interaction",
      properties: {
        agent_id: data.agentId,
        agent_name: data.agentName,
        action: data.action,
        duration_ms: data.duration,
        tokens_used: data.tokens,
        model: data.model,
        category: data.category,
        platform: "LEGACORE",
        timestamp: new Date().toISOString(),
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

// Track task operations
export const trackTaskOperation = async (data: {
  taskId: string
  taskType: string
  userId?: string
  action: "created" | "updated" | "completed" | "failed"
  category?: string
  metadata?: Record<string, any>
}) => {
  try {
    await analytics.track({
      userId: data.userId || "anonymous",
      event: "Task Operation",
      properties: {
        task_id: data.taskId,
        task_type: data.taskType,
        action: data.action,
        category: data.category,
        platform: "LEGACORE",
        timestamp: new Date().toISOString(),
        ...data.metadata,
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

// Track user authentication events
export const trackAuthEvent = async (data: {
  userId: string
  action: "login" | "logout" | "signup" | "password_reset"
  method?: string
}) => {
  try {
    await analytics.track({
      userId: data.userId,
      event: "Authentication",
      properties: {
        action: data.action,
        method: data.method || "email",
        platform: "LEGACORE",
        timestamp: new Date().toISOString(),
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

// Track page views
export const trackPageView = async (data: {
  userId?: string
  page: string
  title?: string
  url?: string
  referrer?: string
}) => {
  try {
    await analytics.page({
      userId: data.userId || "anonymous",
      name: data.page,
      properties: {
        title: data.title,
        url: data.url,
        referrer: data.referrer,
        platform: "LEGACORE",
        timestamp: new Date().toISOString(),
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

// Identify user
export const identifyUser = async (data: {
  userId: string
  traits?: {
    email?: string
    name?: string
    role?: string
    plan?: string
    company?: string
  }
}) => {
  try {
    await analytics.identify({
      userId: data.userId,
      traits: {
        ...data.traits,
        platform: "LEGACORE",
        created_at: new Date().toISOString(),
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

// Track chat messages
export const trackChatMessage = async (data: {
  agentId?: string
  agentName?: string
  userId?: string
  taskId?: string
  taskType?: string
  action: "created" | "updated" | "completed" | "failed"
  category?: string
  metadata?: Record<string, any>
}) => {
  try {
    await analytics.track({
      userId: data.userId || "anonymous",
      event: "Chat Message",
      properties: {
        agent_id: data.agentId,
        agent_name: data.agentName,
        task_id: data.taskId,
        task_type: data.taskType,
        action: data.action,
        category: data.category,
        platform: "LEGACORE",
        timestamp: new Date().toISOString(),
        ...data.metadata,
      },
      context: {
        app: {
          name: "LEGACORE",
          version: "1.0.0",
        },
      },
    })
  } catch (error) {
    console.error("[LEGACORE] Segment tracking error:", error)
  }
}

export default analytics
