"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Brain,
  Target,
  AlertTriangle,
  TrendingUp,
  Settings,
} from "lucide-react"

interface AgentTestResult {
  agentId: string
  agentName: string
  category: string
  status: string
  testQuery: string
  responsePreview?: string
  error?: string
  provider?: string
  model?: string
  toolsAvailable: number
  toolNames: string[]
}

interface TestSummary {
  totalAgents: number
  workingAgents: number
  failedAgents: number
  successRate: string
  aiProviderStatus: any
}

export default function AgentTestPage() {
  const [testResults, setTestResults] = useState<AgentTestResult[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentTestResult | null>(null)

  const runAllTests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/agents/test")
      const data = await response.json()

      if (data.success) {
        setTestResults(data.agentTests)
        setSummary(data.summary)
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Failed to run agent tests:", error)
    } finally {
      setLoading(false)
    }
  }

  const testIndividualAgent = async (agentId: string, testMessage?: string) => {
    try {
      const response = await fetch("/api/agents/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, testMessage }),
      })

      const data = await response.json()
      if (data.success) {
        // Update the specific agent in results
        setTestResults((prev) =>
          prev.map((result) =>
            result.agentId === agentId
              ? {
                  ...result,
                  status: "✅ WORKING",
                  responsePreview: data.test.response.substring(0, 200) + "...",
                  provider: data.test.provider,
                  model: data.test.model,
                }
              : result,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to test individual agent:", error)
    }
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "personal-development": Brain,
      coaching: Target,
      "surplus-funds": TrendingUp,
      "credit-repair": Settings,
      "debt-collection": AlertTriangle,
      "government-contracts": Zap,
    }
    return icons[category] || Bot
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "personal-development": "bg-purple-100 text-purple-800",
      coaching: "bg-blue-100 text-blue-800",
      "surplus-funds": "bg-green-100 text-green-800",
      "credit-repair": "bg-yellow-100 text-yellow-800",
      "debt-collection": "bg-red-100 text-red-800",
      "government-contracts": "bg-indigo-100 text-indigo-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Testing Dashboard</h1>
          <p className="text-muted-foreground">Verify all 6 specialized AI agents are working correctly</p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Testing..." : "Run All Tests"}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAgents}</div>
              <p className="text-xs text-muted-foreground">Specialized AI agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.workingAgents}</div>
              <p className="text-xs text-muted-foreground">Agents functioning properly</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failedAgents}</div>
              <p className="text-xs text-muted-foreground">Agents needing attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.successRate}</div>
              <p className="text-xs text-muted-foreground">Overall system health</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testResults.map((result) => {
              const IconComponent = getCategoryIcon(result.category)
              return (
                <Card
                  key={result.agentId}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedAgent?.agentId === result.agentId ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAgent(result)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        <CardTitle className="text-base">{result.agentName}</CardTitle>
                      </div>
                      <div className="text-lg">
                        {result.status.includes("✅") ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    <Badge className={getCategoryColor(result.category)}>
                      {result.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Status:</p>
                      <p className="text-sm text-muted-foreground">{result.status}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Test Query:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.testQuery}</p>
                    </div>

                    {result.responsePreview && (
                      <div>
                        <p className="text-sm font-medium">Response Preview:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{result.responsePreview}</p>
                      </div>
                    )}

                    {result.error && (
                      <div>
                        <p className="text-sm font-medium text-red-600">Error:</p>
                        <p className="text-sm text-red-600 line-clamp-2">{result.error}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span>Tools: {result.toolsAvailable}</span>
                      {result.provider && <Badge variant="outline">{result.provider}</Badge>}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        testIndividualAgent(result.agentId)
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Retest
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Detailed View */}
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Agent Information: {selectedAgent.agentName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Agent Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>ID:</strong> {selectedAgent.agentId}
                      </div>
                      <div>
                        <strong>Category:</strong> {selectedAgent.category}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedAgent.status}
                      </div>
                      {selectedAgent.provider && (
                        <div>
                          <strong>Provider:</strong> {selectedAgent.provider}
                        </div>
                      )}
                      {selectedAgent.model && (
                        <div>
                          <strong>Model:</strong> {selectedAgent.model}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Available Tools ({selectedAgent.toolsAvailable})</h4>
                    <div className="space-y-1">
                      {selectedAgent.toolNames.map((tool, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Test Query</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedAgent.testQuery}</p>
                </div>

                {selectedAgent.responsePreview && (
                  <div>
                    <h4 className="font-semibold mb-2">Response Preview</h4>
                    <ScrollArea className="h-32 w-full border rounded p-3">
                      <p className="text-sm">{selectedAgent.responsePreview}</p>
                    </ScrollArea>
                  </div>
                )}

                {selectedAgent.error && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Error Details</h4>
                    <p className="text-sm bg-red-50 text-red-700 p-3 rounded">{selectedAgent.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                    <div className="text-lg mt-0.5">
                      {rec.includes("🎉")
                        ? "🎉"
                        : rec.includes("⚠️")
                          ? "⚠️"
                          : rec.includes("🔧")
                            ? "🔧"
                            : rec.includes("💡")
                              ? "💡"
                              : rec.includes("📊")
                                ? "📊"
                                : "🔄"}
                    </div>
                    <p className="text-sm">{rec.replace(/^[🎉⚠️🔧💡📊🔄]\s*/u, "")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          {summary?.aiProviderStatus && (
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {summary.aiProviderStatus.providers?.map((provider: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${provider.available ? "bg-green-500" : "bg-red-500"}`} />
                        <div>
                          <p className="font-medium capitalize">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">Models: {provider.models.join(", ")}</p>
                        </div>
                      </div>
                      <Badge variant={provider.available ? "default" : "secondary"}>
                        {provider.available ? "Available" : "Not Configured"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Configuration Status</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Default Provider:</strong> {summary.aiProviderStatus.defaultProvider}
                      </div>
                      <div>
                        <strong>Fallback Provider:</strong> {summary.aiProviderStatus.fallbackProvider}
                      </div>
                      <div>
                        <strong>Has Any Provider:</strong>{" "}
                        {summary.aiProviderStatus.hasAnyProvider ? "✅ Yes" : "❌ No"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Environment Variables</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${process.env.OPENAI_API_KEY ? "bg-green-500" : "bg-red-500"}`}
                        />
                        OPENAI_API_KEY
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${process.env.XAI_API_KEY ? "bg-green-500" : "bg-red-500"}`}
                        />
                        XAI_API_KEY
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${process.env.GROQ_API_KEY ? "bg-green-500" : "bg-red-500"}`}
                        />
                        GROQ_API_KEY
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
