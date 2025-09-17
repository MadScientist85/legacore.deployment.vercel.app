"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatInterface } from "@/components/chat-interface"
import { useAgents } from "@/hooks/use-agents"
import { Bot, Settings, Clock, TrendingUp, Users, Zap, Brain, Target, Shield, AlertTriangle } from "lucide-react"

interface AgentDetailProps {
  agentId: string
}

export function AgentDetail({ agentId }: AgentDetailProps) {
  const { agents, loading, toggleAgentStatus, getAgentStats } = useAgents()
  const [activeTab, setActiveTab] = useState("overview")

  const agent = agents.find((a) => a.id === agentId)
  const stats = getAgentStats(agentId)

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "personal-development": Brain,
      coaching: Target,
      "surplus-funds": TrendingUp,
      "credit-repair": Settings,
      "debt-collection": AlertTriangle,
      "government-contracts": Shield,
    }
    return icons[category] || Bot
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "personal-development": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      coaching: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "surplus-funds": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "credit-repair": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "debt-collection": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "government-contracts": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    }
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Agent not found</h3>
        <p className="text-muted-foreground">The requested agent could not be found.</p>
      </div>
    )
  }

  const IconComponent = getCategoryIcon(agent.category)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl bg-legacore-steel text-white">
              <IconComponent className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getCategoryColor(agent.category)}>
                {agent.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
              <Badge variant="outline">v{agent.version}</Badge>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${agent.active ? "bg-green-500" : "bg-gray-500"}`} />
                <span className="text-sm text-muted-foreground">{agent.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={agent.active} onCheckedChange={() => toggleAgentStatus(agent.id)} />
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.usage}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{agent.successRate}%</div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">-0.3s from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tools Available</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.tools?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Specialized functions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="tools">Tools & Functions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">System Prompt</h4>
                  <ScrollArea className="h-32 w-full border rounded p-3">
                    <p className="text-sm text-muted-foreground">
                      {agent.systemPrompt || "No system prompt configured"}
                    </p>
                  </ScrollArea>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span>
                    <p className="text-muted-foreground">{agent.model}</p>
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span>
                    <p className="text-muted-foreground">{agent.provider}</p>
                  </div>
                  <div>
                    <span className="font-medium">Temperature:</span>
                    <p className="text-muted-foreground">{agent.temperature || 0.7}</p>
                  </div>
                  <div>
                    <span className="font-medium">Max Tokens:</span>
                    <p className="text-muted-foreground">{agent.maxTokens || 4000}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage This Month</span>
                    <span className="font-medium">{agent.usage} sessions</span>
                  </div>
                  <Progress value={agent.usage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium text-green-600">{agent.successRate}%</span>
                  </div>
                  <Progress value={agent.successRate} className="h-2" />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Conversations:</span>
                    <p className="text-muted-foreground">{stats?.totalConversations || agent.usage}</p>
                  </div>
                  <div>
                    <span className="font-medium">Avg Response Time:</span>
                    <p className="text-muted-foreground">{stats?.avgResponseTime || 1.2}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Examples */}
          {agent.examples && agent.examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Example Interactions</CardTitle>
                <CardDescription>Sample conversations to demonstrate agent capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agent.examples.slice(0, 3).map((example, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">User:</span>
                      </div>
                      <p className="text-sm bg-muted p-2 rounded">{example.input}</p>

                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{agent.name}:</span>
                      </div>
                      <p className="text-sm bg-primary/5 p-2 rounded">{example.output}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <ChatInterface
            agent={{
              id: agent.id,
              name: agent.name,
              description: agent.description,
              category: agent.category,
              model: agent.model,
            }}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools & Functions</CardTitle>
              <CardDescription>Specialized functions this agent can execute</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.tools && agent.tools.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {agent.tools.map((tool, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{tool.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                      {tool.parameters && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Parameters:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(tool.parameters.properties || {}).map((param) => (
                              <Badge key={param} variant="secondary" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tools configured</h3>
                  <p className="text-muted-foreground">This agent doesn't have any specialized tools.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">{Math.floor(agent.usage * 0.3)} sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">{agent.usage} sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All Time</span>
                    <span className="font-medium">{Math.floor(agent.usage * 2.5)} sessions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-green-600">{agent.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Satisfaction</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure agent behavior and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Active Status</h4>
                  <p className="text-sm text-muted-foreground">Enable or disable this agent</p>
                </div>
                <Switch checked={agent.active} onCheckedChange={() => toggleAgentStatus(agent.id)} />
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Model Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Provider:</span>
                    <p className="text-muted-foreground">{agent.provider}</p>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <p className="text-muted-foreground">{agent.model}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline">Export Configuration</Button>
                <Button variant="outline">Reset to Defaults</Button>
                <Button variant="destructive">Delete Agent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
