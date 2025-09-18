import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Database types
export interface Agent {
  id: string
  name: string
  description: string
  category: string
  model: string
  version: string
  active: boolean
  system_prompt: string
  functions: string[]
  tools: any[]
  examples: string[]
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  agent_id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
  input_data: any
  output_data: any
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Conversation {
  id: string
  agent_id: string
  title: string
  messages: any[]
  status: "active" | "archived"
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  type: "conversation" | "task" | "agent" | "system"
  title: string
  description: string
  metadata: any
  created_at: string
}

// Database operations
export const dbOperations = {
  // Agents
  async getAgents(): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching agents:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getAgents:", error)
      return []
    }
  },

  async getAgent(id: string): Promise<Agent | null> {
    try {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching agent:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getAgent:", error)
      return null
    }
  },

  async createAgent(agent: Omit<Agent, "id" | "created_at" | "updated_at">): Promise<Agent | null> {
    try {
      const { data, error } = await supabase.from("agents").insert(agent).select().single()

      if (error) {
        console.error("Error creating agent:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createAgent:", error)
      return null
    }
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    try {
      const { data, error } = await supabase
        .from("agents")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating agent:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateAgent:", error)
      return null
    }
  },

  // Tasks
  async createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    try {
      const { data, error } = await supabase.from("tasks").insert(task).select().single()

      if (error) {
        console.error("Error creating task:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createTask:", error)
      return null
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating task:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateTask:", error)
      return null
    }
  },

  async getTasks(agentId?: string): Promise<Task[]> {
    try {
      let query = supabase.from("tasks").select("*").order("created_at", { ascending: false })

      if (agentId) {
        query = query.eq("agent_id", agentId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching tasks:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getTasks:", error)
      return []
    }
  },

  // Conversations
  async createConversation(
    conversation: Omit<Conversation, "id" | "created_at" | "updated_at">,
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase.from("conversations").insert(conversation).select().single()

      if (error) {
        console.error("Error creating conversation:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createConversation:", error)
      return null
    }
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating conversation:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateConversation:", error)
      return null
    }
  },

  async getConversations(agentId?: string): Promise<Conversation[]> {
    try {
      let query = supabase.from("conversations").select("*").order("updated_at", { ascending: false })

      if (agentId) {
        query = query.eq("agent_id", agentId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching conversations:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getConversations:", error)
      return []
    }
  },

  // Activity Logs
  async logActivity(activity: Omit<ActivityLog, "id" | "created_at">): Promise<ActivityLog | null> {
    try {
      const { data, error } = await supabase.from("activity_logs").insert(activity).select().single()

      if (error) {
        console.error("Error logging activity:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in logActivity:", error)
      return null
    }
  },

  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching activity:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getRecentActivity:", error)
      return []
    }
  },

  // Health checks
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("agents").select("count").limit(1)
      return !error
    } catch (error) {
      console.error("Database connection check failed:", error)
      return false
    }
  },
}

// Utility functions
export async function getAgents(): Promise<Agent[]> {
  return dbOperations.getAgents()
}

export async function getAgent(id: string): Promise<Agent | null> {
  return dbOperations.getAgent(id)
}

export async function createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
  return dbOperations.createTask(task)
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  return dbOperations.updateTask(id, updates)
}

export async function getTasks(agentId?: string): Promise<Task[]> {
  return dbOperations.getTasks(agentId)
}

export async function createConversation(
  conversation: Omit<Conversation, "id" | "created_at" | "updated_at">,
): Promise<Conversation | null> {
  return dbOperations.createConversation(conversation)
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
  return dbOperations.updateConversation(id, updates)
}

export async function getConversations(agentId?: string): Promise<Conversation[]> {
  return dbOperations.getConversations(agentId)
}

export async function logActivity(activity: Omit<ActivityLog, "id" | "created_at">): Promise<ActivityLog | null> {
  return dbOperations.logActivity(activity)
}

export async function getRecentActivity(limit = 10): Promise<ActivityLog[]> {
  return dbOperations.getRecentActivity(limit)
}

export default supabase
