export interface Agent {
  id: string
  name: string
  description: string
  category: string
  systemPrompt: string
  functions: AgentFunction[]
  examples: string[]
  version: string
  created_at?: string
  updated_at?: string
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

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
  agent_id?: string
  input_data: Record<string, any>
  output_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  metadata: Record<string, any>
  created_at: string
}

export interface AIProviderStatus {
  openai: {
    status: "connected" | "disconnected" | "error"
    lastChecked: Date
    error?: string
  }
  groq: {
    status: "connected" | "disconnected" | "error"
    lastChecked: Date
    error?: string
  }
  grok: {
    status: "connected" | "disconnected" | "error"
    lastChecked: Date
    error?: string
  }
}

export interface GoogleAuthData {
  access_token: string
  refresh_token?: string
  scope: string
  token_type: string
  expires_in: number
}

export interface FileMetadata {
  id: string
  name: string
  mimeType: string
  size: number
  createdTime: string
  modifiedTime: string
  webViewLink?: string
  webContentLink?: string
}
