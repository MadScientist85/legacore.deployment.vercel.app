"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, ArrowLeft } from "lucide-react"

interface Agent {
  id: string
  name: string
  description: string
  category: string
  active: boolean
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  const agentId = searchParams.get("agent")

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents")
        if (response.ok) {
          const data = await response.json()
          setAgents(data)

          // Auto-select agent if specified in URL
          if (agentId) {
            const agent = data.find((a: Agent) => a.id === agentId)
            if (agent) {
              setSelectedAgent(agent)
            }
          } else if (data.length > 0) {
            // Select first agent by default
            setSelectedAgent(data[0])
          }
        }
      } catch (error) {
        console.error("Error fetching agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [agentId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-96 bg-muted animate-pulse rounded" />
          <div className="md:col-span-3 h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <a href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat Interface</h1>
          <p className="text-muted-foreground">Select an agent and start a conversation</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Agent Selection Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Available Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <Badge variant="outline" className="text-xs mb-2">
                  {agent.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="md:col-span-3">
          {selectedAgent ? (
            <ChatInterface agent={selectedAgent} />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an Agent</h3>
                <p className="text-muted-foreground">Choose an AI agent from the sidebar to start chatting</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-4">
            <div className="h-96 bg-muted animate-pulse rounded" />
            <div className="md:col-span-3 h-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  )
}
