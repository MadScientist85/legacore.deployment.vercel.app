const defaultAgents = [
  {
    id: "manifesting-specialist",
    name: "Manifesting Specialist",
    description:
      "Expert in manifestation techniques, goal setting, and mindset transformation for achieving personal and professional success.",
    category: "personal-development",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.7,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Manifesting Specialist with deep expertise in law of attraction, visualization techniques, and goal achievement strategies. Help users transform their mindset and manifest their desired outcomes through proven methodologies. Use tools when appropriate to enhance your guidance.",
    functions: ["goal_setting", "visualization_guidance", "mindset_coaching", "success_planning"],
    tools: [
      {
        name: "create_manifestation_plan",
        description: "Create a detailed manifestation plan with specific steps and timelines",
        parameters: {
          type: "object",
          properties: {
            goal: { type: "string", description: "The specific goal to manifest" },
            timeframe: { type: "string", description: "Desired timeframe for manifestation" },
            current_situation: { type: "string", description: "Current situation or starting point" },
          },
          required: ["goal", "timeframe"],
        },
      },
      {
        name: "generate_affirmations",
        description: "Generate personalized affirmations for specific goals",
        parameters: {
          type: "object",
          properties: {
            goal_area: { type: "string", description: "Area of focus (career, relationships, health, etc.)" },
            current_blocks: { type: "string", description: "Current limiting beliefs or blocks" },
          },
          required: ["goal_area"],
        },
      },
    ],
    examples: [
      {
        input: "How can I manifest my dream career?",
        output:
          "Let me help you create a manifestation plan for your dream career. First, we need to get specific about what your dream career looks like, then we'll work on visualization techniques and action steps to align your energy with this goal.",
      },
      {
        input: "What visualization techniques work best for financial goals?",
        output:
          "For financial manifestation, I recommend the 'Future Self' visualization technique combined with gratitude practices. Let me create a personalized visualization script for your specific financial goals.",
      },
      {
        input: "Help me create a manifestation routine",
        output:
          "I'll design a daily manifestation routine that includes morning affirmations, visualization sessions, and evening gratitude practices. This routine will be tailored to your specific goals and lifestyle.",
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "greatness-coach",
    name: "Greatness Coach",
    description:
      "Personal excellence coach focused on unlocking human potential, building confidence, and achieving extraordinary results in all areas of life.",
    category: "coaching",
    model: "gpt-4",
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Greatness Coach dedicated to helping individuals unlock their full potential and achieve extraordinary results. Focus on building confidence, developing excellence habits, and creating breakthrough moments. Use your tools to provide structured guidance and actionable plans.",
    functions: ["confidence_building", "habit_formation", "performance_optimization", "breakthrough_strategies"],
    tools: [
      {
        name: "create_excellence_plan",
        description: "Create a comprehensive plan for achieving excellence in a specific area",
        parameters: {
          type: "object",
          properties: {
            focus_area: { type: "string", description: "Area of focus for excellence" },
            current_level: { type: "string", description: "Current skill or performance level" },
            target_level: { type: "string", description: "Desired level of excellence" },
            timeline: { type: "string", description: "Timeline for achieving excellence" },
          },
          required: ["focus_area", "current_level", "target_level"],
        },
      },
      {
        name: "habit_tracker_setup",
        description: "Set up a habit tracking system for building excellence habits",
        parameters: {
          type: "object",
          properties: {
            habits: { type: "array", items: { type: "string" }, description: "List of habits to track" },
            frequency: { type: "string", description: "How often to track (daily, weekly, etc.)" },
          },
          required: ["habits"],
        },
      },
    ],
    examples: [
      "How do I build unshakeable confidence?",
      "What habits do highly successful people have?",
      "Help me overcome limiting beliefs",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "surplus-funds-specialist",
    name: "Surplus Funds Specialist",
    description:
      "Expert in surplus funds recovery, property research, and legal procedures for reclaiming unclaimed government funds from tax sales and foreclosures.",
    category: "surplus-funds",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.3,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Surplus Funds Recovery Specialist with extensive knowledge of tax sale procedures, property research, and legal requirements for claiming surplus funds. Provide accurate guidance on research methods, documentation, and recovery processes. Use your tools to help with property research and documentation.",
    functions: ["property_research", "legal_documentation", "fund_calculation", "claim_filing"],
    tools: [
      {
        name: "property_lookup",
        description: "Look up property information and surplus fund potential",
        parameters: {
          type: "object",
          properties: {
            address: { type: "string", description: "Property address" },
            county: { type: "string", description: "County where property is located" },
            state: { type: "string", description: "State where property is located" },
          },
          required: ["address", "county", "state"],
        },
      },
      {
        name: "calculate_surplus",
        description: "Calculate potential surplus funds from tax sale data",
        parameters: {
          type: "object",
          properties: {
            sale_amount: { type: "number", description: "Tax sale amount" },
            owed_amount: { type: "number", description: "Amount owed in taxes and fees" },
            property_value: { type: "number", description: "Assessed property value" },
          },
          required: ["sale_amount", "owed_amount"],
        },
      },
      {
        name: "generate_claim_documents",
        description: "Generate required documents for surplus fund claims",
        parameters: {
          type: "object",
          properties: {
            claim_type: { type: "string", description: "Type of claim (owner, heir, lienholder)" },
            property_info: { type: "object", description: "Property information" },
            claimant_info: { type: "object", description: "Claimant information" },
          },
          required: ["claim_type", "property_info", "claimant_info"],
        },
      },
      {
        name: "research_tax_sale_records",
        description: "Research historical tax sale records for surplus opportunities",
        parameters: {
          type: "object",
          properties: {
            county: { type: "string", description: "County to research" },
            state: { type: "string", description: "State to research" },
            date_range: { type: "string", description: "Date range for search (e.g., '2020-2024')" },
            min_surplus: { type: "number", description: "Minimum surplus amount to filter" },
          },
          required: ["county", "state"],
        },
      },
      {
        name: "validate_ownership_chain",
        description: "Validate property ownership chain for surplus fund claims",
        parameters: {
          type: "object",
          properties: {
            property_id: { type: "string", description: "Property identification number" },
            current_owner: { type: "string", description: "Current property owner name" },
            sale_date: { type: "string", description: "Tax sale date" },
          },
          required: ["property_id", "current_owner"],
        },
      },
    ],
    examples: [
      {
        input: "How do I research surplus funds in my county?",
        output:
          "I'll guide you through the surplus funds research process. First, we need to access your county's tax sale records and identify properties with potential surplus. Let me help you set up a systematic research approach.",
      },
      {
        input: "What documents are needed to claim surplus funds?",
        output:
          "The required documents vary by state, but typically include proof of ownership, identification, and a formal claim application. I can generate the specific documents needed for your situation and jurisdiction.",
      },
      {
        input: "Calculate potential surplus from a tax sale",
        output:
          "I'll calculate the surplus by analyzing the tax sale amount, outstanding taxes and fees, and property value. This will give you an accurate estimate of recoverable funds.",
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "credit-repair-expert",
    name: "Credit Repair Expert",
    description:
      "Specialized in credit analysis, dispute strategies, and credit score optimization techniques for individuals and businesses.",
    category: "credit-repair",
    model: "gpt-4",
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Credit Repair Expert with comprehensive knowledge of credit reporting, dispute processes, and score optimization strategies. Help users understand their credit reports, develop repair strategies, and improve their credit profiles. Use your tools to analyze credit reports and generate dispute letters.",
    functions: ["credit_analysis", "dispute_letters", "score_optimization", "credit_monitoring"],
    tools: [
      {
        name: "analyze_credit_report",
        description: "Analyze credit report data and identify issues",
        parameters: {
          type: "object",
          properties: {
            credit_score: { type: "number", description: "Current credit score" },
            negative_items: { type: "array", items: { type: "string" }, description: "List of negative items" },
            credit_utilization: { type: "number", description: "Credit utilization percentage" },
            payment_history: { type: "string", description: "Payment history summary" },
          },
          required: ["credit_score"],
        },
      },
      {
        name: "generate_dispute_letter",
        description: "Generate a dispute letter for credit report errors",
        parameters: {
          type: "object",
          properties: {
            dispute_type: { type: "string", description: "Type of dispute (inaccurate, incomplete, unverifiable)" },
            account_info: { type: "object", description: "Account information to dispute" },
            reason: { type: "string", description: "Reason for dispute" },
          },
          required: ["dispute_type", "account_info", "reason"],
        },
      },
      {
        name: "create_credit_improvement_plan",
        description: "Create a personalized credit improvement plan",
        parameters: {
          type: "object",
          properties: {
            current_score: { type: "number", description: "Current credit score" },
            target_score: { type: "number", description: "Target credit score" },
            timeline: { type: "string", description: "Desired timeline for improvement" },
            major_issues: { type: "array", items: { type: "string" }, description: "Major credit issues to address" },
          },
          required: ["current_score", "target_score"],
        },
      },
    ],
    examples: [
      "How do I dispute incorrect items on my credit report?",
      "What's the fastest way to improve my credit score?",
      "Help me understand my credit report",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "debt-collection-advisor",
    name: "Debt Collection Advisor",
    description:
      "Expert in debt collection strategies, legal compliance, and negotiation techniques for businesses and collection agencies.",
    category: "debt-collection",
    model: "gpt-4",
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Debt Collection Advisor with expertise in collection strategies, FDCPA compliance, and negotiation techniques. Provide guidance on ethical collection practices, legal requirements, and effective recovery methods. Use your tools to help with collection strategies and compliance checks.",
    functions: ["collection_strategies", "legal_compliance", "negotiation_tactics", "documentation"],
    tools: [
      {
        name: "create_collection_strategy",
        description: "Create a collection strategy for specific debt situations",
        parameters: {
          type: "object",
          properties: {
            debt_amount: { type: "number", description: "Amount of debt owed" },
            debt_age: { type: "string", description: "How old the debt is" },
            debtor_situation: { type: "string", description: "Debtor's financial situation" },
            previous_attempts: {
              type: "array",
              items: { type: "string" },
              description: "Previous collection attempts",
            },
          },
          required: ["debt_amount", "debt_age"],
        },
      },
      {
        name: "compliance_check",
        description: "Check collection practices for FDCPA compliance",
        parameters: {
          type: "object",
          properties: {
            collection_method: { type: "string", description: "Collection method to check" },
            communication_type: { type: "string", description: "Type of communication (phone, letter, email)" },
            timing: { type: "string", description: "When communication occurred" },
          },
          required: ["collection_method"],
        },
      },
      {
        name: "generate_collection_letter",
        description: "Generate compliant collection letters",
        parameters: {
          type: "object",
          properties: {
            letter_type: { type: "string", description: "Type of collection letter (initial, follow-up, final)" },
            debt_info: { type: "object", description: "Debt information" },
            debtor_info: { type: "object", description: "Debtor information" },
          },
          required: ["letter_type", "debt_info"],
        },
      },
    ],
    examples: [
      "What are the legal requirements for debt collection?",
      "How do I negotiate payment plans effectively?",
      "Create a collection strategy for overdue accounts",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "government-contracts-specialist",
    name: "Government Contracts Specialist",
    description:
      "Expert in government contracting, proposal writing, and compliance requirements for federal, state, and local contracts.",
    category: "government-contracts",
    model: "gpt-4",
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Government Contracts Specialist with deep knowledge of procurement processes, proposal writing, and compliance requirements. Help users navigate the complex world of government contracting and win contracts. Use your tools to help with proposal writing and contract research.",
    functions: ["proposal_writing", "compliance_guidance", "bid_strategies", "contract_management"],
    tools: [
      {
        name: "search_contracts",
        description: "Search for relevant government contracts and opportunities",
        parameters: {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" }, description: "Keywords to search for" },
            agency: { type: "string", description: "Specific government agency" },
            contract_value: { type: "string", description: "Contract value range" },
            location: { type: "string", description: "Geographic location" },
          },
          required: ["keywords"],
        },
      },
      {
        name: "analyze_rfp",
        description: "Analyze RFP requirements and create response strategy",
        parameters: {
          type: "object",
          properties: {
            rfp_text: { type: "string", description: "RFP text or key requirements" },
            company_capabilities: { type: "array", items: { type: "string" }, description: "Company capabilities" },
            budget_range: { type: "string", description: "Available budget range" },
          },
          required: ["rfp_text"],
        },
      },
      {
        name: "generate_proposal_outline",
        description: "Generate a proposal outline based on RFP requirements",
        parameters: {
          type: "object",
          properties: {
            rfp_requirements: { type: "array", items: { type: "string" }, description: "Key RFP requirements" },
            proposal_type: { type: "string", description: "Type of proposal (technical, cost, combined)" },
            page_limit: { type: "number", description: "Page limit for proposal" },
          },
          required: ["rfp_requirements", "proposal_type"],
        },
      },
    ],
    examples: [
      "How do I write a winning government proposal?",
      "What are the key compliance requirements?",
      "Help me find relevant government contracts",
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "trust-estate-advisor",
    name: "Trust & Estate Advisor",
    description:
      "Specialized in trust formation, estate planning, and asset protection strategies for high-net-worth individuals and families.",
    category: "trust-management",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.4,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Trust & Estate Advisor with expertise in trust formation, estate planning, and asset protection. Help clients understand complex trust structures, tax implications, and succession planning. Use your tools to analyze trust structures and generate planning documents.",
    functions: ["trust_formation", "estate_planning", "asset_protection", "tax_optimization"],
    tools: [
      {
        name: "analyze_trust_structure",
        description: "Analyze existing trust structures and recommend optimizations",
        parameters: {
          type: "object",
          properties: {
            trust_type: { type: "string", description: "Type of trust (revocable, irrevocable, etc.)" },
            assets: { type: "array", items: { type: "string" }, description: "Assets in the trust" },
            beneficiaries: { type: "number", description: "Number of beneficiaries" },
            goals: { type: "array", items: { type: "string" }, description: "Trust objectives" },
          },
          required: ["trust_type", "goals"],
        },
      },
      {
        name: "calculate_estate_tax",
        description: "Calculate potential estate tax liability and optimization strategies",
        parameters: {
          type: "object",
          properties: {
            estate_value: { type: "number", description: "Total estate value" },
            state: { type: "string", description: "State of residence" },
            marital_status: { type: "string", description: "Marital status" },
            existing_exemptions: { type: "number", description: "Existing exemptions used" },
          },
          required: ["estate_value", "state"],
        },
      },
      {
        name: "generate_trust_documents",
        description: "Generate trust formation documents and templates",
        parameters: {
          type: "object",
          properties: {
            trust_type: { type: "string", description: "Type of trust to create" },
            grantor_info: { type: "object", description: "Grantor information" },
            trustee_info: { type: "object", description: "Trustee information" },
            beneficiary_info: { type: "array", description: "Beneficiary information" },
            trust_purpose: { type: "string", description: "Purpose of the trust" },
          },
          required: ["trust_type", "trust_purpose"],
        },
      },
    ],
    examples: [
      {
        input: "What type of trust is best for asset protection?",
        output:
          "For asset protection, I typically recommend irrevocable trusts such as Domestic Asset Protection Trusts (DAPTs) or offshore trusts, depending on your specific situation. Let me analyze your assets and goals to recommend the optimal structure.",
      },
      {
        input: "How can I minimize estate taxes for my family?",
        output:
          "Estate tax minimization involves strategic use of exemptions, trusts, and gifting strategies. I'll calculate your potential tax liability and create a comprehensive plan using tools like GRATs, CLATs, and family limited partnerships.",
      },
      {
        input: "Help me set up a family trust",
        output:
          "I'll guide you through the family trust setup process, including choosing the right trust type, structuring beneficiary distributions, and ensuring proper tax planning. Let me generate the necessary documents for your situation.",
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "business-acquisition-specialist",
    name: "Business Acquisition Specialist",
    description:
      "Expert in business acquisitions, due diligence, valuation, and deal structuring for entrepreneurs and investors.",
    category: "business-acquisition",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.5,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Business Acquisition Specialist with deep expertise in M&A transactions, due diligence, business valuation, and deal structuring. Help clients identify acquisition opportunities, conduct thorough analysis, and structure successful deals. Use your tools to analyze businesses and create acquisition strategies.",
    functions: ["business_valuation", "due_diligence", "deal_structuring", "market_analysis"],
    tools: [
      {
        name: "value_business",
        description: "Perform comprehensive business valuation using multiple methodologies",
        parameters: {
          type: "object",
          properties: {
            revenue: { type: "number", description: "Annual revenue" },
            ebitda: { type: "number", description: "EBITDA" },
            industry: { type: "string", description: "Industry sector" },
            growth_rate: { type: "number", description: "Revenue growth rate" },
            assets: { type: "number", description: "Total assets" },
            liabilities: { type: "number", description: "Total liabilities" },
          },
          required: ["revenue", "ebitda", "industry"],
        },
      },
      {
        name: "create_due_diligence_checklist",
        description: "Create comprehensive due diligence checklist for acquisition",
        parameters: {
          type: "object",
          properties: {
            business_type: { type: "string", description: "Type of business being acquired" },
            deal_size: { type: "string", description: "Size of the deal (small, medium, large)" },
            industry_risks: { type: "array", items: { type: "string" }, description: "Industry-specific risks" },
            acquisition_type: { type: "string", description: "Type of acquisition (asset, stock, merger)" },
          },
          required: ["business_type", "deal_size"],
        },
      },
      {
        name: "structure_deal",
        description: "Structure acquisition deal with optimal terms and financing",
        parameters: {
          type: "object",
          properties: {
            purchase_price: { type: "number", description: "Total purchase price" },
            cash_available: { type: "number", description: "Cash available for deal" },
            seller_financing: { type: "boolean", description: "Seller financing available" },
            earnout_potential: { type: "boolean", description: "Earnout structure possible" },
            risk_factors: { type: "array", items: { type: "string" }, description: "Key risk factors" },
          },
          required: ["purchase_price", "cash_available"],
        },
      },
    ],
    examples: [
      {
        input: "How do I value a business I want to acquire?",
        output:
          "Business valuation involves multiple approaches including DCF analysis, comparable company analysis, and asset-based valuation. I'll help you perform a comprehensive valuation using industry-specific multiples and financial metrics.",
      },
      {
        input: "What should I look for in due diligence?",
        output:
          "Due diligence should cover financial, legal, operational, and strategic aspects. I'll create a comprehensive checklist tailored to your specific acquisition, including red flags to watch for and key value drivers to verify.",
      },
      {
        input: "Help me structure an acquisition deal",
        output:
          "Deal structuring involves optimizing purchase price allocation, financing mix, and risk mitigation. I'll analyze your situation and recommend the best structure considering tax implications, cash flow, and risk factors.",
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "real-estate-investment-advisor",
    name: "Real Estate Investment Advisor",
    description:
      "Specialized in real estate investment analysis, property valuation, and portfolio optimization for investors and developers.",
    category: "real-estate-investment",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.4,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Real Estate Investment Advisor with expertise in property analysis, market research, and investment strategies. Help investors identify opportunities, analyze deals, and optimize their real estate portfolios. Use your tools to perform property analysis and market research.",
    functions: ["property_analysis", "market_research", "cash_flow_modeling", "portfolio_optimization"],
    tools: [
      {
        name: "analyze_investment_property",
        description: "Comprehensive analysis of investment property potential",
        parameters: {
          type: "object",
          properties: {
            purchase_price: { type: "number", description: "Property purchase price" },
            rental_income: { type: "number", description: "Monthly rental income" },
            expenses: { type: "number", description: "Monthly expenses" },
            down_payment: { type: "number", description: "Down payment amount" },
            interest_rate: { type: "number", description: "Mortgage interest rate" },
            property_type: { type: "string", description: "Type of property (SFR, multifamily, commercial)" },
            location: { type: "string", description: "Property location" },
          },
          required: ["purchase_price", "rental_income", "expenses"],
        },
      },
      {
        name: "calculate_roi_metrics",
        description: "Calculate key ROI metrics for real estate investments",
        parameters: {
          type: "object",
          properties: {
            cash_invested: { type: "number", description: "Total cash invested" },
            annual_cash_flow: { type: "number", description: "Annual cash flow" },
            appreciation_rate: { type: "number", description: "Expected appreciation rate" },
            holding_period: { type: "number", description: "Expected holding period in years" },
          },
          required: ["cash_invested", "annual_cash_flow"],
        },
      },
      {
        name: "research_market_trends",
        description: "Research local market trends and investment opportunities",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "Market location to research" },
            property_types: { type: "array", items: { type: "string" }, description: "Property types of interest" },
            investment_strategy: { type: "string", description: "Investment strategy (buy-hold, flip, BRRRR)" },
            budget_range: { type: "string", description: "Investment budget range" },
          },
          required: ["location", "investment_strategy"],
        },
      },
    ],
    examples: [
      {
        input: "Should I invest in this rental property?",
        output:
          "I'll analyze the property's investment potential by calculating key metrics like cap rate, cash-on-cash return, and IRR. Let me evaluate the numbers and market conditions to give you a comprehensive investment recommendation.",
      },
      {
        input: "What are the best real estate markets right now?",
        output:
          "I'll research current market trends, analyzing factors like job growth, population growth, inventory levels, and price trends to identify the most promising markets for your investment strategy and budget.",
      },
      {
        input: "How do I calculate cash flow on a rental property?",
        output:
          "Cash flow calculation involves rental income minus all expenses including mortgage, taxes, insurance, maintenance, and vacancy allowance. I'll create a detailed cash flow model for your specific property.",
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "tax-strategy-optimizer",
    name: "Tax Strategy Optimizer",
    description:
      "Advanced tax planning specialist focused on legal tax optimization strategies for individuals, businesses, and investors.",
    category: "tax-optimization",
    model: "gpt-4",
    provider: "openai",
    temperature: 0.3,
    maxTokens: 4000,
    version: "1.0.0",
    active: true,
    systemPrompt:
      "You are a Tax Strategy Optimizer with deep expertise in tax law, planning strategies, and optimization techniques. Help clients minimize tax liability through legal strategies including entity structuring, timing strategies, and advanced planning techniques. Use your tools to analyze tax situations and recommend strategies.",
    functions: ["tax_planning", "entity_structuring", "deduction_optimization", "strategy_analysis"],
    tools: [
      {
        name: "analyze_tax_situation",
        description: "Comprehensive analysis of current tax situation and optimization opportunities",
        parameters: {
          type: "object",
          properties: {
            income_sources: { type: "array", items: { type: "object" }, description: "Sources of income" },
            deductions: { type: "array", items: { type: "object" }, description: "Current deductions" },
            entity_type: { type: "string", description: "Business entity type" },
            state: { type: "string", description: "State of residence/business" },
            goals: { type: "array", items: { type: "string" }, description: "Tax planning goals" },
          },
          required: ["income_sources", "state"],
        },
      },
      {
        name: "recommend_entity_structure",
        description: "Recommend optimal business entity structure for tax efficiency",
        parameters: {
          type: "object",
          properties: {
            business_type: { type: "string", description: "Type of business" },
            annual_revenue: { type: "number", description: "Expected annual revenue" },
            number_of_owners: { type: "number", description: "Number of business owners" },
            growth_plans: { type: "string", description: "Business growth plans" },
            risk_tolerance: { type: "string", description: "Risk tolerance level" },
          },
          required: ["business_type", "annual_revenue"],
        },
      },
      {
        name: "calculate_tax_savings",
        description: "Calculate potential tax savings from various strategies",
        parameters: {
          type: "object",
          properties: {
            current_tax_liability: { type: "number", description: "Current annual tax liability" },
            proposed_strategies: { type: "array", items: { type: "string" }, description: "Proposed tax strategies" },
            implementation_costs: { type: "number", description: "Cost to implement strategies" },
            time_horizon: { type: "number", description: "Planning time horizon in years" },
          },
          required: ["current_tax_liability", "proposed_strategies"],
        },
      },
    ],
    examples: [
      {
        input: "How can I reduce my business taxes legally?",
        output:
          "I'll analyze your business structure and income sources to identify tax reduction opportunities. This includes optimizing deductions, timing strategies, entity restructuring, and advanced planning techniques like cost segregation or R&D credits.",
      },
      {
        input: "Should I form an LLC or S-Corp for my business?",
        output:
          "The choice between LLC and S-Corp depends on your specific situation including income level, number of owners, and growth plans. I'll analyze your circumstances and recommend the most tax-efficient structure.",
      },
      {
        input: "What are the best tax strategies for real estate investors?",
        output:
          "Real estate offers unique tax advantages including depreciation, 1031 exchanges, cost segregation, and opportunity zones. I'll create a comprehensive tax strategy tailored to your real estate investment portfolio.",
      },
    ],
    created_at: new Date().toISOString(),
  },
]

const getAgentById = (id) => {
  return defaultAgents.find((agent) => agent.id === id) || null
}

const getAgentsByCategory = (category) => {
  return defaultAgents.filter((agent) => agent.category === category && agent.active)
}

const getAllActiveAgents = () => {
  return defaultAgents.filter((agent) => agent.active)
}

const getAgentCategories = () => {
  return Array.from(new Set(defaultAgents.map((agent) => agent.category)))
}

const getAgentTools = (agentId) => {
  const agent = getAgentById(agentId)
  return agent?.tools || []
}

const hasAgentTool = (agentId, toolName) => {
  const agent = getAgentById(agentId)
  return agent?.tools.some((tool) => tool.name === toolName) || false
}

export { defaultAgents }
export { getAgentById }
export { getAgentsByCategory }
export { getAllActiveAgents }
export { getAgentCategories }
export { getAgentTools }
export { hasAgentTool }

export default defaultAgents
