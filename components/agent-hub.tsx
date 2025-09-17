"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useAgents, type AgentWithStats } from "@/hooks/use-agents"
import { Search, Bot, Settings, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useSegmentTracking } from "@/hooks/use-segment-tracking"

interface AgentHubProps {
  onSelectAgent?: (agentId: string) => void
  selectedAgentId?: string
}

export function AgentHub({ onSelectAgent, selectedAgentId }: AgentHubProps) {
  const { agents, loading, toggleAgentStatus } = useAgents()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const { trackFeatureUsage, trackAgentInteraction } = useSegmentTracking()

  const categories = [
    { id: "all", name: "All Agents", count: agents.length },
    {
      id: "personal-development",
      name: "Personal Development",
      count: agents.filter((a) => a.category === "personal-development").length,
    },
    { id: "coaching", name: "Coaching", count: agents.filter((a) => a.category === "coaching").length },
    { id: "surplus-funds", name: "Surplus Funds", count: agents.filter((a) => a.category === "surplus-funds").length },
    { id: "credit-repair", name: "Credit Repair", count: agents.filter((a) => a.category === "credit-repair").length },
    {
      id: "debt-collection",
      name: "Debt Collection",
      count: agents.filter((a) => a.category === "debt-collection").length,
    },
    {
      id: "government-contracts",
      name: "Government Contracts",
      count: agents.filter((a) => a.category === "government-contracts").length,
    },
  ]

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "personal-development":
        return "🌟"
      case "coaching":
        return "🎯"
      case "surplus-funds":
        return "💰"
      case "credit-repair":
        return "📊"
      case "debt-collection":
        return "📋"
      case "government-contracts":
        return "🏛️"
      default:
        return "🤖"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const handleAgentSelect = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    if (agent) {
      trackAgentInteraction({
        agentId: agent.id,
        agentName: agent.name,
        action: "create",
        category: agent.category,
      })
    }
    onSelectAgent?.(agentId)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      trackFeatureUsage({
        feature: "agent_hub",
        action: "search",
        metadata: { query_length: query.length, results_count: filteredAgents.length },
      })
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    trackFeatureUsage({
      feature: "agent_hub",
      action: "filter_category",
      metadata: { category, agents_count: categories.find((c) => c.id === category)?.count || 0 },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Agent Hub</h2>
            <p className="text-muted-foreground">Manage and deploy your specialized AI agents</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {agents.filter((a) => a.active).length} Active
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onSelect={() => handleAgentSelect(agent.id)}
                onToggleStatus={() => {
                  toggleAgentStatus(agent.id)
                  trackFeatureUsage({
                    feature: "agent_hub",
                    action: "toggle_status",
                    metadata: { agent_id: agent.id, agent_name: agent.name, new_status: !agent.active },
                  })
                }}
              />
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface AgentCardProps {
  agent: AgentWithStats
  isSelected: boolean
  onSelect: () => void
  onToggleStatus: () => void
}

function AgentCard({ agent, isSelected, onSelect, onToggleStatus }: AgentCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "personal-development":
        return "🌟"
      case "coaching":
        return "🎯"
      case "surplus-funds":
        return "💰"
      case "credit-repair":
        return "📊"
      case "debt-collection":
        return "📋"
      case "government-contracts":
        return "🏛️"
      default:
        return "🤖"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-lg">{getCategoryIcon(agent.category)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
              </div>
            </div>
          </div>
          <Switch checked={agent.active} onCheckedChange={onToggleStatus} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm line-clamp-2">{agent.description}</CardDescription>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">{agent.usage} sessions</span>
          </div>
          <Progress value={agent.usage} className="h-2" />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Success Rate</span>
          <span className="font-medium text-green-600">{agent.successRate}%</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {agent.category.replace("-", " ")}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            v{agent.version}
          </Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={onSelect}>
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </Button>
          <Link href={`/agents/${agent.id}`}>
            <Button size="sm" variant="ghost">
              <Settings className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Named export
export { AgentHub as default }
