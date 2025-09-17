export interface AgentConfig {
  id: string
  name: string
  description: string
  category: string
  systemPrompt: string
  functions: AgentFunction[]
  examples: AgentExample[]
  version: string
  provider: "openai" | "gemini"
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AgentFunction {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

export interface AgentExample {
  input: string
  output: string
  context?: string
}

export interface AgentTask {
  id: string
  agent_id: string
  user_id: string
  input: string
  output?: string
  status: "pending" | "running" | "completed" | "failed"
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface AgentThread {
  id: string
  agent_id: string
  user_id: string
  title: string
  messages: AgentMessage[]
  created_at: string
  updated_at: string
}

export interface AgentMessage {
  id: string
  thread_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  metadata?: Record<string, any>
}
