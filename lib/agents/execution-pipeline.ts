import { createClient } from "@/lib/supabase/server"
import { aiRouter } from "@/lib/ai-router"
import { getAgentById } from "@/lib/agents.config"
import type { AgentConfig, AgentTask, AgentThread, AgentMessage } from "@/lib/types/agent"

export class AgentExecutionPipeline {
  private supabase = createClient()

  async createTask(agentId: string, userId: string, input: string, metadata?: Record<string, any>): Promise<AgentTask> {
    const { data, error } = await (await this.supabase)
      .from("agent_tasks")
      .insert({
        agent_id: agentId,
        user_id: userId,
        input,
        metadata: metadata || {},
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async executeTask(taskId: string): Promise<void> {
    const supabase = await this.supabase

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("agent_tasks")
      .select("*, agents(*)")
      .eq("id", taskId)
      .single()

    if (taskError || !task) throw new Error("Task not found")

    // Update status to running
    await supabase
      .from("agent_tasks")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", taskId)

    try {
      const agent = getAgentById(task.agent_id)
      if (!agent) throw new Error("Agent configuration not found")

      // Enhanced execution with tool calling
      const result = await this.executeWithTools(agent, task.input, task.metadata)

      if (result.success) {
        // Update task with result
        await supabase
          .from("agent_tasks")
          .update({
            status: "completed",
            output: result.output,
            metadata: { ...task.metadata, ...result.metadata },
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId)

        // Log activity
        await this.logActivity(task.user_id, "task_completed", "agent_task", taskId, {
          agent_id: agent.id,
          input_length: task.input.length,
          output_length: result.output?.length || 0,
          tools_used: result.metadata?.tools_used || [],
          execution_time: result.metadata?.execution_time || 0,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      // Update task with error
      await supabase
        .from("agent_tasks")
        .update({
          status: "failed",
          output: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      // Log error
      await this.logActivity(task.user_id, "task_failed", "agent_task", taskId, {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }

  private async executeWithTools(
    agent: AgentConfig,
    input: string,
    metadata?: Record<string, any>,
  ): Promise<{
    success: boolean
    output?: string
    error?: string
    metadata?: Record<string, any>
  }> {
    const startTime = Date.now()
    const toolsUsed: string[] = []

    try {
      // Check if agent has tools and if input requires tool usage
      const needsTools = this.analyzeToolRequirement(agent, input)

      if (needsTools && agent.tools && agent.tools.length > 0) {
        // Execute with function calling
        return await this.executeWithFunctionCalling(agent, input, toolsUsed, startTime)
      } else {
        // Standard text generation
        const messages = [
          { role: "system" as const, content: agent.systemPrompt },
          { role: "user" as const, content: input },
        ]

        const response = await aiRouter.generateResponse(messages)

        return {
          success: true,
          output: response.text,
          metadata: {
            provider: response.provider,
            model: response.model,
            execution_time: Date.now() - startTime,
            tools_used: toolsUsed,
            usage: response.usage,
          },
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          execution_time: Date.now() - startTime,
          tools_used: toolsUsed,
        },
      }
    }
  }

  private async executeWithFunctionCalling(
    agent: AgentConfig,
    input: string,
    toolsUsed: string[],
    startTime: number,
  ): Promise<{
    success: boolean
    output?: string
    error?: string
    metadata?: Record<string, any>
  }> {
    try {
      // Prepare system prompt with tool descriptions
      const toolDescriptions = agent.tools?.map((tool) => `${tool.name}: ${tool.description}`).join("\n") || ""

      const systemPrompt = `${agent.systemPrompt}

Available Tools:
${toolDescriptions}

When you need to use a tool, respond with a JSON object in this format:
{
  "action": "use_tool",
  "tool": "tool_name",
  "parameters": { ... }
}

Otherwise, respond normally with text.`

      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: input },
      ]

      const response = await aiRouter.generateResponse(messages)
      let finalOutput = response.text
      const conversationHistory = [...messages, { role: "assistant" as const, content: response.text }]

      // Check if response indicates tool usage
      const toolUsage = this.parseToolUsage(response.text)

      if (toolUsage) {
        // Execute the tool
        const toolResult = await this.executeTool(agent, toolUsage.tool, toolUsage.parameters)
        toolsUsed.push(toolUsage.tool)

        // Continue conversation with tool result
        conversationHistory.push({
          role: "user" as const,
          content: `Tool "${toolUsage.tool}" executed. Result: ${JSON.stringify(toolResult)}`,
        })

        // Get final response incorporating tool result
        const finalResponse = await aiRouter.generateResponse(conversationHistory)
        finalOutput = finalResponse.text
      }

      return {
        success: true,
        output: finalOutput,
        metadata: {
          provider: response.provider,
          model: response.model,
          execution_time: Date.now() - startTime,
          tools_used: toolsUsed,
          usage: response.usage,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
        metadata: {
          execution_time: Date.now() - startTime,
          tools_used: toolsUsed,
        },
      }
    }
  }

  private analyzeToolRequirement(agent: AgentConfig, input: string): boolean {
    if (!agent.tools || agent.tools.length === 0) return false

    const toolKeywords = agent.tools.flatMap((tool) => [
      tool.name.toLowerCase(),
      ...tool.name.split("_").map((word) => word.toLowerCase()),
      ...tool.description.toLowerCase().split(" ").slice(0, 5),
    ])

    const inputLower = input.toLowerCase()
    return toolKeywords.some((keyword) => inputLower.includes(keyword))
  }

  private parseToolUsage(response: string): { tool: string; parameters: any } | null {
    try {
      // Look for JSON object in response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.action === "use_tool" && parsed.tool && parsed.parameters) {
        return {
          tool: parsed.tool,
          parameters: parsed.parameters,
        }
      }
    } catch (error) {
      // Not a valid tool usage response
    }
    return null
  }

  private async executeTool(agent: AgentConfig, toolName: string, parameters: any): Promise<any> {
    const tool = agent.tools?.find((t) => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found for agent "${agent.name}"`)
    }

    // Validate parameters against tool schema
    this.validateToolParameters(tool, parameters)

    // Execute tool based on agent category and tool type
    switch (agent.category) {
      case "surplus-funds":
        return await this.executeSurplusFundsTool(toolName, parameters)
      case "credit-repair":
        return await this.executeCreditRepairTool(toolName, parameters)
      case "debt-collection":
        return await this.executeDebtCollectionTool(toolName, parameters)
      case "government-contracts":
        return await this.executeGovernmentContractsTool(toolName, parameters)
      case "trust-management":
        return await this.executeTrustManagementTool(toolName, parameters)
      case "business-acquisition":
        return await this.executeBusinessAcquisitionTool(toolName, parameters)
      case "real-estate-investment":
        return await this.executeRealEstateTool(toolName, parameters)
      case "tax-optimization":
        return await this.executeTaxOptimizationTool(toolName, parameters)
      default:
        return await this.executeGenericTool(toolName, parameters)
    }
  }

  private async executeSurplusFundsTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case "property_lookup":
        return {
          property_id: `${parameters.county}-${Date.now()}`,
          address: parameters.address,
          county: parameters.county,
          state: parameters.state,
          tax_sale_date: "2023-08-15",
          surplus_potential: Math.floor(Math.random() * 50000) + 5000,
          status: "Available for claim",
        }
      case "calculate_surplus":
        const surplus = parameters.sale_amount - parameters.owed_amount
        return {
          surplus_amount: Math.max(0, surplus),
          calculation_breakdown: {
            sale_amount: parameters.sale_amount,
            owed_amount: parameters.owed_amount,
            net_surplus: surplus,
          },
          claimable: surplus > 0,
        }
      case "research_tax_sale_records":
        return {
          records_found: Math.floor(Math.random() * 20) + 5,
          total_surplus_potential: Math.floor(Math.random() * 500000) + 100000,
          properties: Array.from({ length: 5 }, (_, i) => ({
            id: `${parameters.county}-${i + 1}`,
            surplus_estimate: Math.floor(Math.random() * 25000) + 5000,
            sale_date: "2023-08-15",
          })),
        }
      default:
        return { result: "Tool executed successfully", parameters }
    }
  }

  private async executeCreditRepairTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case "analyze_credit_report":
        return {
          score_analysis: {
            current_score: parameters.credit_score,
            score_range: this.getCreditScoreRange(parameters.credit_score),
            improvement_potential: Math.min(850 - parameters.credit_score, 150),
          },
          negative_items_count: parameters.negative_items?.length || 0,
          utilization_impact: parameters.credit_utilization > 30 ? "High impact" : "Low impact",
          recommendations: [
            "Dispute inaccurate items",
            "Reduce credit utilization below 30%",
            "Set up payment reminders",
          ],
        }
      case "create_credit_improvement_plan":
        const scoreDiff = parameters.target_score - parameters.current_score
        return {
          plan_duration: `${Math.ceil(scoreDiff / 10)} months`,
          monthly_goals: Array.from({ length: 6 }, (_, i) => ({
            month: i + 1,
            target_score: parameters.current_score + (i + 1) * Math.floor(scoreDiff / 6),
            actions: ["Pay down balances", "Dispute negative items", "Monitor progress"],
          })),
          estimated_timeline: `${Math.ceil(scoreDiff / 15)} months`,
        }
      default:
        return { result: "Credit repair tool executed", parameters }
    }
  }

  private async executeBusinessAcquisitionTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case "value_business":
        const revenueMultiple = this.getIndustryMultiple(parameters.industry)
        const assetValue = (parameters.assets || 0) - (parameters.liabilities || 0)
        return {
          valuation_methods: {
            revenue_multiple: parameters.revenue * revenueMultiple,
            ebitda_multiple: parameters.ebitda * (revenueMultiple + 2),
            asset_based: Math.max(assetValue, 0),
          },
          recommended_range: {
            low: parameters.ebitda * (revenueMultiple - 1),
            high: parameters.ebitda * (revenueMultiple + 1),
          },
          industry_multiple: revenueMultiple,
        }
      case "structure_deal":
        const cashPercent = (parameters.cash_available / parameters.purchase_price) * 100
        return {
          recommended_structure: {
            cash_down: parameters.cash_available,
            seller_financing: parameters.seller_financing ? parameters.purchase_price * 0.3 : 0,
            bank_financing: Math.max(0, parameters.purchase_price - parameters.cash_available),
            earnout: parameters.earnout_potential ? parameters.purchase_price * 0.2 : 0,
          },
          financing_options: ["SBA loan", "Seller financing", "Asset-based lending"],
          risk_mitigation: parameters.risk_factors?.slice(0, 3) || [],
        }
      default:
        return { result: "Business acquisition tool executed", parameters }
    }
  }

  private getCreditScoreRange(score: number): string {
    if (score >= 800) return "Excellent"
    if (score >= 740) return "Very Good"
    if (score >= 670) return "Good"
    if (score >= 580) return "Fair"
    return "Poor"
  }

  private getIndustryMultiple(industry: string): number {
    const multiples: Record<string, number> = {
      technology: 6,
      healthcare: 4,
      manufacturing: 3,
      retail: 2,
      services: 3,
      construction: 2.5,
    }
    return multiples[industry.toLowerCase()] || 3
  }

  private validateToolParameters(tool: any, parameters: any): void {
    const required = tool.parameters?.required || []
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Missing required parameter: ${param}`)
      }
    }
  }

  private async executeGenericTool(toolName: string, parameters: any): Promise<any> {
    return {
      tool_name: toolName,
      parameters,
      result: "Generic tool execution completed",
      timestamp: new Date().toISOString(),
    }
  }

  // Placeholder methods for other tool categories
  private async executeDebtCollectionTool(toolName: string, parameters: any): Promise<any> {
    return { result: "Debt collection tool executed", parameters }
  }

  private async executeGovernmentContractsTool(toolName: string, parameters: any): Promise<any> {
    return { result: "Government contracts tool executed", parameters }
  }

  private async executeTrustManagementTool(toolName: string, parameters: any): Promise<any> {
    return { result: "Trust management tool executed", parameters }
  }

  private async executeRealEstateTool(toolName: string, parameters: any): Promise<any> {
    return { result: "Real estate tool executed", parameters }
  }

  private async executeTaxOptimizationTool(toolName: string, parameters: any): Promise<any> {
    return { result: "Tax optimization tool executed", parameters }
  }

  async createThread(agentId: string, userId: string, title: string): Promise<AgentThread> {
    const { data, error } = await (await this.supabase)
      .from("agent_threads")
      .insert({
        agent_id: agentId,
        user_id: userId,
        title,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async addMessage(threadId: string, role: "user" | "assistant" | "system", content: string): Promise<AgentMessage> {
    const { data, error } = await (await this.supabase)
      .from("agent_messages")
      .insert({
        thread_id: threadId,
        role,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async streamConversation(threadId: string, userMessage: string) {
    const supabase = await this.supabase

    // Get thread and agent details
    const { data: thread, error: threadError } = await supabase
      .from("agent_threads")
      .select("*, agents(*)")
      .eq("id", threadId)
      .single()

    if (threadError || !thread) throw new Error("Thread not found")

    // Add user message
    await this.addMessage(threadId, "user", userMessage)

    // Get conversation history
    const { data: messages } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })

    // Build conversation context
    const conversationContext = messages?.map((msg) => `${msg.role}: ${msg.content}`).join("\n") || ""

    const agent = getAgentById(thread.agent_id)
    if (!agent) throw new Error("Agent configuration not found")

    const fullPrompt = `${conversationContext}\nuser: ${userMessage}`

    // Stream response with enhanced capabilities
    const result = await this.executeWithTools(agent, fullPrompt)

    if (result.success && result.output) {
      // Add assistant message to thread
      await this.addMessage(threadId, "assistant", result.output)
      return result.output
    } else {
      throw new Error(result.error || "Failed to generate response")
    }
  }

  private async logActivity(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>,
  ) {
    await (await this.supabase).from("activity_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
    })
  }
}

export const executionPipeline = new AgentExecutionPipeline()
