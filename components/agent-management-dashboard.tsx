"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Activity,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react"
import { defaultAgents } from "@/lib/agents.config"
import type { Agent } from "@/lib/supabase"
import { useSegmentTracking } from "@/hooks/use-segment-tracking"

interface AgentMetrics {
  totalInteractions: number
  successRate: number
  avgResponseTime: number
  lastUsed: string
  errorCount: number
  activeThreads: number
}

interface AgentFormData {
  name: string
  description: string
  category: string
  systemPrompt: string
  provider: "openai" | "gemini"
  model: string
  temperature: number
  maxTokens: number
  active: boolean
  tools: Array<{
    name: string
    description: string
    parameters: Record<string, any>
  }>
}

const AGENT_CATEGORIES = [
  { value: "surplus-funds", label: "Surplus Funds Recovery" },
  { value: "credit-repair", label: "Credit Repair Services" },
  { value: "debt-collection", label: "Debt Collection" },
  { value: "government-contracts", label: "Government Contracts" },
  { value: "trust-management", label: "Trust Management" },
  { value: "business-acquisition", label: "Business Acquisition" },
  { value: "real-estate-investment", label: "Real Estate Investment" },
  { value: "tax-optimization", label: "Tax Optimization" },
  { value: "personal-development", label: "Personal Development" },
  { value: "general", label: "General Purpose" },
]

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI GPT-4" },
  { value: "gemini", label: "Google Gemini Pro" },
]

export function AgentManagementDashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { trackFeatureUsage, trackAgentInteraction } = useSegmentTracking()

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    description: "",
    category: "general",
    systemPrompt: "",
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    active: true,
    tools: [],
  })

  useEffect(() => {
    loadAgents()
    loadAgentMetrics()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use the default agents configuration
      const agentData = defaultAgents.map((agent) => ({
        ...agent,
        id: agent.id,
        agent_id: agent.id,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        system_prompt: agent.systemPrompt,
        provider: agent.provider || "openai",
        model: agent.model || "gpt-4",
        temperature: agent.temperature || 0.7,
        max_tokens: agent.maxTokens || 2000,
        active: agent.active,
        tools: agent.tools || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      setAgents(agentData as Agent[])
    } catch (error) {
      console.error("Failed to load agents:", error)
      toast.error("Failed to load agents")
    } finally {
      setLoading(false)
    }
  }

  const loadAgentMetrics = async () => {
    try {
      // Mock metrics data - in real implementation, fetch from analytics API
      const metrics: Record<string, AgentMetrics> = {}
      defaultAgents.forEach((agent) => {
        metrics[agent.id] = {
          totalInteractions: Math.floor(Math.random() * 1000) + 100,
          successRate: Math.floor(Math.random() * 20) + 80,
          avgResponseTime: Math.floor(Math.random() * 500) + 200,
          lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          errorCount: Math.floor(Math.random() * 10),
          activeThreads: Math.floor(Math.random() * 5),
        }
      })
      setAgentMetrics(metrics)
    } catch (error) {
      console.error("Failed to load agent metrics:", error)
    }
  }

  const handleCreateAgent = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.description || !formData.systemPrompt) {
        toast.error("Please fill in all required fields")
        return
      }

      // In real implementation, save to Supabase
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        agent_id: `agent-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        system_prompt: formData.systemPrompt,
        provider: formData.provider,
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.maxTokens,
        active: formData.active,
        tools: formData.tools,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setAgents([...agents, newAgent])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Agent created successfully")

      await trackAgentInteraction({
        agentId: newAgent.id,
        agentName: newAgent.name,
        action: "create",
        category: newAgent.category,
      })
    } catch (error) {
      console.error("Failed to create agent:", error)
      toast.error("Failed to create agent")
    }
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return

    try {
      const updatedAgent: Agent = {
        ...selectedAgent,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        system_prompt: formData.systemPrompt,
        provider: formData.provider,
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.maxTokens,
        active: formData.active,
        tools: formData.tools,
        updated_at: new Date().toISOString(),
      }

      setAgents(agents.map((agent) => (agent.id === selectedAgent.id ? updatedAgent : agent)))
      setIsEditDialogOpen(false)
      setSelectedAgent(null)
      resetForm()
      toast.success("Agent updated successfully")

      await trackAgentInteraction({
        agentId: updatedAgent.id,
        agentName: updatedAgent.name,
        action: "update",
        category: updatedAgent.category,
      })
    } catch (error) {
      console.error("Failed to update agent:", error)
      toast.error("Failed to update agent")
    }
  }

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      setAgents(agents.filter((a) => a.id !== agent.id))
      toast.success("Agent deleted successfully")

      await trackAgentInteraction({
        agentId: agent.id,
        agentName: agent.name,
        action: "delete",
        category: agent.category,
      })
    } catch (error) {
      console.error("Failed to delete agent:", error)
      toast.error("Failed to delete agent")
    }
  }

  const handleToggleAgent = async (agent: Agent) => {
    try {
      const updatedAgent = { ...agent, active: !agent.active }
      setAgents(agents.map((a) => (a.id === agent.id ? updatedAgent : a)))
      toast.success(`Agent ${updatedAgent.active ? "activated" : "deactivated"}`)

      await trackAgentInteraction({
        agentId: agent.id,
        agentName: agent.name,
        action: updatedAgent.active ? "activate" : "deactivate",
        category: agent.category,
      })
    } catch (error) {
      console.error("Failed to toggle agent:", error)
      toast.error("Failed to update agent status")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "general",
      systemPrompt: "",
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
      active: true,
      tools: [],
    })
  }

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setFormData({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      systemPrompt: agent.system_prompt,
      provider: agent.provider as "openai" | "gemini",
      model: agent.model,
      temperature: agent.temperature || 0.7,
      maxTokens: agent.max_tokens || 2000,
      active: agent.active,
      tools: agent.tools || [],
    })
    setIsEditDialogOpen(true)
  }

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || agent.category === categoryFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && agent.active) ||
      (statusFilter === "inactive" && !agent.active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleExportAgents = () => {
    const exportData = agents.map((agent) => ({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      systemPrompt: agent.system_prompt,
      provider: agent.provider,
      model: agent.model,
      active: agent.active,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "legacore-agents.json"
    a.click()
    URL.revokeObjectURL(url)

    trackFeatureUsage({
      feature: "agent_management",
      action: "export_agents",
      metadata: { agent_count: agents.length },
    })
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

  const totalAgents = agents.length
  const activeAgents = agents.filter((a) => a.active).length
  const totalInteractions = Object.values(agentMetrics).reduce((sum, metrics) => sum + metrics.totalInteractions, 0)
  const avgSuccessRate =
    Object.values(agentMetrics).reduce((sum, metrics) => sum + metrics.successRate, 0) /
      Object.keys(agentMetrics).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Management Dashboard</h1>
          <p className="text-muted-foreground">Create, configure, and monitor your AI agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportAgents} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAgents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>Configure a new AI agent for your LEGACORE™ platform</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Surplus Funds Specialist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this agent does and its capabilities"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value: "openai" | "gemini") => setFormData({ ...formData, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="gpt-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
                    <input
                      type="range"
                      id="temperature"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: Number.parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: Number.parseInt(e.target.value) })}
                      min="100"
                      max="4000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder="You are a specialized AI assistant that helps with..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active (agent will be available for use)</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAgent}>Create Agent</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">{activeAgents} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Platform average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(agentMetrics).reduce((sum, metrics) => sum + metrics.activeThreads, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
          <CardDescription>Manage and monitor your AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {AGENT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent List */}
          <div className="space-y-4">
            {filteredAgents.map((agent) => {
              const metrics = agentMetrics[agent.id] || {
                totalInteractions: 0,
                successRate: 0,
                avgResponseTime: 0,
                lastUsed: new Date().toISOString(),
                errorCount: 0,
                activeThreads: 0,
              }

              return (
                <Card key={agent.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{agent.name}</h3>
                          <Badge variant={agent.active ? "default" : "secondary"}>
                            {agent.active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {AGENT_CATEGORIES.find((c) => c.value === agent.category)?.label || agent.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Interactions:</span>
                            <div className="font-medium">{metrics.totalInteractions.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success Rate:</span>
                            <div className="font-medium text-green-600">{metrics.successRate}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Response:</span>
                            <div className="font-medium">{metrics.avgResponseTime}ms</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Used:</span>
                            <div className="font-medium">{new Date(metrics.lastUsed).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleAgent(agent)}>
                        {agent.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(agent)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAgent(agent)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first AI agent to get started"}
              </p>
              {!searchQuery && categoryFilter === "all" && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Update agent configuration and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Agent Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Surplus Funds Specialist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this agent does and its capabilities"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt *</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="You are a specialized AI assistant that helps with..."
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="edit-active">Active (agent will be available for use)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent}>Update Agent</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
