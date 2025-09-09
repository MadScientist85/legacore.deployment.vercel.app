"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Bot,
  Command,
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  FileText,
  Upload,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { defaultAgents } from "@/lib/agents.config"

interface AIStatus {
  system: {
    status: string
    currentProvider: string
    currentModel: string
  }
  providers: Array<{
    name: string
    status: string
    statusColor: string
    model: string
  }>
  validation: {
    hasAnyProvider: boolean
    warnings: string[]
    errors: string[]
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const [aiStatus, setAiStatus] = React.useState<AIStatus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch AI status on mount
  React.useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const response = await fetch("/api/ai-status")
        const data = await response.json()
        if (data.success) {
          setAiStatus(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch AI status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAIStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchAIStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const data = {
    user: {
      name: "LEGACORE Admin",
      email: "admin@legacore.ai",
      avatar: "/placeholder-user.jpg",
    },
    teams: [
      {
        name: "LEGACORE™",
        logo: Command,
        plan: "Enterprise",
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: SquareTerminal,
        isActive: pathname === "/",
      },
      {
        title: "AI Agent Hub",
        url: "/agents",
        icon: Bot,
        isActive: pathname.startsWith("/agents"),
      },
      {
        title: "Chat Interface",
        url: "/chat",
        icon: MessageSquare,
        isActive: pathname.startsWith("/chat"),
      },
      {
        title: "System Admin",
        url: "/admin",
        icon: Settings2,
        isActive: pathname.startsWith("/admin"),
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
    projects: [
      {
        name: "Surplus Funds Recovery",
        url: "/agents?category=surplus-funds",
        icon: BarChart3,
      },
      {
        name: "Credit Repair Services",
        url: "/agents?category=credit-repair",
        icon: Users,
      },
      {
        name: "Government Contracts",
        url: "/agents?category=government-contracts",
        icon: Shield,
      },
      {
        name: "Personal Development",
        url: "/agents?category=personal-development",
        icon: Activity,
      },
      {
        name: "Debt Collection",
        url: "/agents?category=debt-collection",
        icon: BarChart3,
      },
    ],
  }

  const getStatusIcon = (status: string, color: string) => {
    switch (color) {
      case "green":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "yellow":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case "red":
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <XCircle className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/chat")}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Start Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/tasks")}>
                  <FileText className="h-4 w-4" />
                  <span>New Task</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/file-manager")}>
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Agents */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {defaultAgents
                .filter((agent) => agent.active)
                .slice(0, 6)
                .map((agent) => (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton onClick={() => router.push(`/agents/${agent.id}`)} className="justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span className="truncate">{agent.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {agent.category.split("-")[0]}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavProjects projects={data.projects} />

        {/* AI Provider Status */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Providers</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {isLoading ? (
                <div className="text-xs text-muted-foreground">Loading status...</div>
              ) : aiStatus ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span>System:</span>
                    <Badge
                      variant={aiStatus.system.status === "healthy" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {aiStatus.system.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{aiStatus.system.currentModel}</div>
                  <Separator className="my-2" />
                  {aiStatus.providers.slice(0, 4).map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(provider.status, provider.statusColor)}
                        <span>{provider.name}</span>
                      </div>
                      <span className="text-muted-foreground">{provider.status}</span>
                    </div>
                  ))}
                  {aiStatus.validation.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 mt-2">{aiStatus.validation.warnings[0]}</div>
                  )}
                </>
              ) : (
                <div className="text-xs text-red-500">Failed to load status</div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-transparent"
            onClick={() => router.push("/settings")}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
