const prompts = [
    // Marketing Prompts
    {
        title: "Social Media Campaign Strategy",
        content: "Create a comprehensive social media campaign strategy for [product/service]. Include platform selection, content themes, posting schedule, engagement tactics, and KPIs. Target audience: [demographics]. Campaign duration: [timeframe]. Budget: [amount].",
        category: "marketing"
    },
    {
        title: "Email Marketing Sequence",
        content: "Design a 5-email nurture sequence for [product/service]. Include subject lines, preview text, main content, CTAs, and timing between emails. Goal: Convert leads into customers. Tone: [professional/casual/friendly].",
        category: "marketing"
    },
    {
        title: "Brand Messaging Framework",
        content: "Develop a brand messaging framework including mission statement, value proposition, brand personality, tone of voice guidelines, and key messaging pillars for [company name] in the [industry] sector.",
        category: "marketing"
    },
    {
        title: "Content Marketing Calendar",
        content: "Create a 3-month content marketing calendar for [business type]. Include blog topics, social media posts, email newsletters, and promotional content. Focus on [primary goal: awareness/engagement/conversion].",
        category: "marketing"
    },
    {
        title: "Competitor Analysis Report",
        content: "Conduct a detailed competitor analysis for [your company] against [competitor names]. Analyze their marketing strategies, unique selling points, pricing, customer reviews, and market positioning. Provide actionable insights.",
        category: "marketing"
    },
    {
        title: "Product Launch Campaign",
        content: "Design a comprehensive product launch campaign for [product name]. Include pre-launch buzz strategies, launch day activities, post-launch follow-up, PR tactics, and influencer outreach plan.",
        category: "marketing"
    },

    // Sales Prompts
    {
        title: "Sales Pitch Script",
        content: "Write a compelling sales pitch script for [product/service]. Include attention grabber, problem identification, solution presentation, benefit statements, objection handling, and closing techniques. Target buyer: [role/industry].",
        category: "sales"
    },
    {
        title: "Cold Email Template",
        content: "Create a personalized cold email template for reaching out to [target role] at [company type]. Include subject line variations, personalization tokens, value proposition, social proof, and clear CTA. Keep under 150 words.",
        category: "sales"
    },
    {
        title: "Sales Objection Responses",
        content: "Develop responses to the top 10 sales objections for [product/service]. Include empathetic acknowledgment, reframing techniques, evidence/proof points, and transition back to value. Common objections: price, timing, competitor comparison.",
        category: "sales"
    },
    {
        title: "Lead Qualification Framework",
        content: "Create a lead qualification framework using BANT or MEDDIC methodology for [product/service]. Include qualifying questions, scoring criteria, handoff process, and follow-up cadence for different lead tiers.",
        category: "sales"
    },
    {
        title: "Sales Follow-up Sequence",
        content: "Design a multi-touch follow-up sequence after initial sales meeting. Include email templates, call scripts, LinkedIn messages, and value-add content for each touchpoint. Timeline: 30 days. Assume no response scenario.",
        category: "sales"
    },
    {
        title: "Customer Success Story Template",
        content: "Create a customer success story template that highlights [product/service] value. Include sections for challenge, solution, implementation, results with metrics, and customer quote. Format for both written and video testimonials.",
        category: "sales"
    },

    // Coding Prompts
    {
        title: "Code Review Checklist",
        content: "Create a comprehensive code review checklist for [programming language/framework]. Include items for code quality, performance, security, documentation, testing, and best practices. Organize by priority: critical, important, nice-to-have.",
        category: "coding"
    },
    {
        title: "API Documentation Template",
        content: "Generate complete API documentation for [endpoint/service]. Include endpoint descriptions, request/response examples, authentication details, error codes, rate limits, and SDK code samples in multiple languages.",
        category: "coding"
    },
    {
        title: "Algorithm Optimization",
        content: "Analyze and optimize this algorithm for [specific problem]. Explain current time/space complexity, identify bottlenecks, suggest improvements, and provide optimized code with complexity analysis. Consider edge cases and scalability.",
        category: "coding"
    },
    {
        title: "Database Schema Design",
        content: "Design a normalized database schema for [application type]. Include table structures, relationships, indexes, constraints, and sample queries. Consider scalability, performance, and data integrity. Provide both SQL and ERD.",
        category: "coding"
    },
    {
        title: "Testing Strategy",
        content: "Develop a comprehensive testing strategy for [application/feature]. Include unit tests, integration tests, E2E tests, performance tests, and security tests. Provide test case examples and recommended tools/frameworks.",
        category: "coding"
    },
    {
        title: "Debugging Assistant",
        content: "Help debug this [error/issue] in [language/framework]. Analyze the error message, explain possible causes, provide step-by-step debugging approach, and suggest multiple solutions with pros/cons of each approach.",
        category: "coding"
    },

    // Creative Prompts
    {
        title: "Story Plot Generator",
        content: "Create a unique story plot with the following elements: Genre: [genre], Setting: [time/place], Main character: [brief description], Central conflict: [type], Tone: [mood]. Include plot twist and character arc.",
        category: "creative"
    },
    {
        title: "Brand Name Brainstorm",
        content: "Generate 20 creative brand name options for [business type/product]. Consider: memorable, easy to pronounce, domain availability, trademark potential, and emotional connection. Include tagline suggestions for top 5 names.",
        category: "creative"
    },
    {
        title: "Video Script Writing",
        content: "Write a [duration] video script for [platform] about [topic]. Include hook, main content points, visual cues, transitions, and strong CTA. Target audience: [demographics]. Tone: [style]. Include b-roll suggestions.",
        category: "creative"
    },
    {
        title: "Creative Campaign Concept",
        content: "Develop a creative campaign concept for [brand/product]. Include big idea, key visuals, messaging, campaign mechanics, channel strategy, and potential partnerships. Goal: [awareness/engagement/conversion].",
        category: "creative"
    },
    {
        title: "Character Development",
        content: "Create a detailed character profile including: name, age, appearance, personality traits, backstory, motivations, fears, relationships, and unique quirks. Purpose: [main/supporting character] for [medium: novel/screenplay/game].",
        category: "creative"
    },
    {
        title: "Creative Writing Prompt Expansion",
        content: "Take this premise: [basic idea] and expand it into a full creative concept. Include setting details, character dynamics, thematic elements, potential plot points, and unique angles that make it fresh and engaging.",
        category: "creative"
    },

    // Personal Development Prompts
    {
        title: "Goal Setting Framework",
        content: "Create a SMART goal framework for [personal/professional objective]. Break down into quarterly milestones, weekly actions, daily habits, and success metrics. Include potential obstacles and mitigation strategies.",
        category: "personal_development"
    },
    {
        title: "Career Development Plan",
        content: "Design a 5-year career development plan for [current role] aspiring to [target role]. Include skill gaps analysis, learning roadmap, networking strategy, milestone positions, and actionable monthly steps.",
        category: "personal_development"
    },
    {
        title: "Productivity System Design",
        content: "Create a personalized productivity system based on [work style/preferences]. Include task management method, time blocking strategy, focus techniques, energy management tips, and tool recommendations.",
        category: "personal_development"
    },
    {
        title: "Habit Formation Strategy",
        content: "Develop a 30-day habit formation plan for [desired habit]. Include trigger design, reward system, tracking method, accountability measures, and strategies for overcoming common obstacles.",
        category: "personal_development"
    },
    {
        title: "Learning Plan Creator",
        content: "Create a structured learning plan for mastering [skill/subject]. Include resource recommendations, practice exercises, milestone assessments, time allocation, and methods for retaining and applying knowledge.",
        category: "personal_development"
    },
    {
        title: "Life Balance Assessment",
        content: "Conduct a life balance assessment across 8 key areas: career, health, relationships, personal growth, finances, recreation, environment, and contribution. Provide scores, improvement strategies, and 90-day action plan.",
        category: "personal_development"
    },

    // Customer Service Prompts
    {
        title: "Customer Complaint Response",
        content: "Write an empathetic response to an angry customer complaint about [issue]. Include acknowledgment, apology where appropriate, solution offered, follow-up steps, and relationship recovery tactics. Tone: professional yet caring.",
        category: "customer_service"
    },
    {
        title: "FAQ Document Creation",
        content: "Create a comprehensive FAQ document for [product/service]. Include 20 common questions with clear, concise answers. Organize by category, use customer-friendly language, and include helpful links/resources.",
        category: "customer_service"
    },
    {
        title: "Customer Service Scripts",
        content: "Develop customer service scripts for [5 common scenarios]. Include greeting, problem identification, empathy statements, solution steps, and closing. Add variations for different customer personalities.",
        category: "customer_service"
    },
    {
        title: "Service Recovery Strategy",
        content: "Design a service recovery strategy for [specific failure scenario]. Include immediate response, resolution process, compensation guidelines, follow-up protocol, and prevention measures. Focus on turning detractors into promoters.",
        category: "customer_service"
    },
    {
        title: "Customer Onboarding Flow",
        content: "Create a customer onboarding flow for [product/service]. Include welcome message, setup steps, resource links, milestone celebrations, and check-in schedule. Design for both self-service and high-touch scenarios.",
        category: "customer_service"
    },
    {
        title: "Feedback Response Templates",
        content: "Create response templates for different types of customer feedback: positive reviews, constructive criticism, feature requests, and negative reviews. Include personalization elements and next-step actions.",
        category: "customer_service"
    },

    // SEO Prompts
    {
        title: "SEO Content Strategy",
        content: "Develop a comprehensive SEO content strategy for [website/niche]. Include keyword research methodology, content pillars, topic clusters, publishing schedule, and link building tactics. Target: [geographic/demographic].",
        category: "seo"
    },
    {
        title: "Meta Description Optimization",
        content: "Write optimized meta titles and descriptions for [10 pages]. Include primary keyword, compelling copy, character limits compliance, and CTR optimization techniques. Current rankings: [provide data].",
        category: "seo"
    },
    {
        title: "Technical SEO Audit",
        content: "Perform a technical SEO audit checklist for [website]. Include site speed, mobile optimization, crawlability, indexation, schema markup, internal linking, and Core Web Vitals. Prioritize fixes by impact.",
        category: "seo"
    },
    {
        title: "Local SEO Strategy",
        content: "Create a local SEO strategy for [business type] in [location]. Include Google My Business optimization, local citations, review management, local content creation, and local link building tactics.",
        category: "seo"
    },
    {
        title: "Content Optimization Guide",
        content: "Optimize existing content for [target keyword]. Analyze current performance, identify gaps, suggest improvements for headings, content depth, internal links, images, and user engagement signals.",
        category: "seo"
    },
    {
        title: "Link Building Campaign",
        content: "Design a white-hat link building campaign for [website]. Include target site identification, outreach templates, content assets needed, relationship building tactics, and success metrics. Monthly target: [number] quality links.",
        category: "seo"
    },

    // Engineering Prompts
    {
        title: "System Architecture Design",
        content: "Design a scalable system architecture for [application type]. Include component diagram, technology stack recommendations, data flow, API design, security considerations, and scaling strategies for [expected load].",
        category: "engineering"
    },
    {
        title: "CI/CD Pipeline Setup",
        content: "Create a complete CI/CD pipeline for [project type]. Include build stages, testing integration, deployment strategies, rollback procedures, monitoring setup, and infrastructure as code examples.",
        category: "engineering"
    },
    {
        title: "Performance Optimization Plan",
        content: "Develop a performance optimization plan for [system/application]. Include profiling methodology, bottleneck identification, optimization strategies, caching implementation, and performance monitoring setup.",
        category: "engineering"
    },
    {
        title: "Security Implementation Guide",
        content: "Create a security implementation guide for [application type]. Cover authentication, authorization, data encryption, input validation, OWASP top 10 mitigation, and security testing procedures.",
        category: "engineering"
    },
    {
        title: "Microservices Migration Strategy",
        content: "Design a strategy to migrate monolithic application to microservices. Include service boundary identification, data management approach, communication patterns, deployment strategy, and phased migration plan.",
        category: "engineering"
    },
    {
        title: "Disaster Recovery Plan",
        content: "Develop a comprehensive disaster recovery plan for [system]. Include RTO/RPO definitions, backup strategies, failover procedures, testing protocols, and communication plan. Consider various failure scenarios.",
        category: "engineering"
    },

    // Education Prompts
    {
        title: "Lesson Plan Creator",
        content: "Create a detailed lesson plan for teaching [topic] to [age group/level]. Include learning objectives, materials needed, introduction hook, main activities, assessment methods, and differentiation strategies.",
        category: "education"
    },
    {
        title: "Study Guide Generator",
        content: "Develop a comprehensive study guide for [subject/topic]. Include key concepts summary, important formulas/facts, practice questions with answers, mnemonics, and visual aids suggestions. Format for easy review.",
        category: "education"
    },
    {
        title: "Interactive Learning Activity",
        content: "Design an interactive learning activity for [concept]. Include clear instructions, required materials, learning goals, step-by-step process, discussion questions, and assessment rubric. Time: [duration].",
        category: "education"
    },
    {
        title: "Course Curriculum Design",
        content: "Create a [duration] course curriculum for [subject]. Include module breakdown, learning outcomes, required readings, assignments, assessment strategy, and week-by-week schedule. Level: [beginner/intermediate/advanced].",
        category: "education"
    },
    {
        title: "Educational Content Simplifier",
        content: "Take this complex topic: [topic] and explain it for [age/grade level]. Use analogies, real-world examples, visual descriptions, and interactive elements. Break down into digestible chunks with comprehension checks.",
        category: "education"
    },
    {
        title: "Assessment Creation Tool",
        content: "Create a comprehensive assessment for [topic/skill]. Include multiple question types, clear rubrics, accommodations for different learners, and both formative and summative assessment options. Align with [standards/objectives].",
        category: "education"
    },

    // Finance Prompts
    {
        title: "Financial Analysis Report",
        content: "Conduct a financial analysis for [company/investment]. Include key ratios, trend analysis, peer comparison, strengths/weaknesses, and investment recommendation. Consider: profitability, liquidity, efficiency, and leverage metrics.",
        category: "finance"
    },
    {
        title: "Budget Planning Template",
        content: "Create a comprehensive budget plan for [individual/business]. Include income sources, expense categories, savings goals, emergency fund allocation, and month-by-month projections. Add variance analysis and adjustment strategies.",
        category: "finance"
    },
    {
        title: "Investment Strategy Development",
        content: "Develop an investment strategy for [investor profile]. Consider risk tolerance, time horizon, goals, and current market conditions. Include asset allocation, specific recommendations, rebalancing strategy, and risk management.",
        category: "finance"
    },
    {
        title: "Financial Model Builder",
        content: "Build a financial model for [business/project]. Include revenue projections, cost structure, cash flow analysis, sensitivity analysis, and key assumptions. Provide base, best, and worst case scenarios.",
        category: "finance"
    },
    {
        title: "Risk Assessment Framework",
        content: "Create a risk assessment framework for [financial decision/investment]. Identify potential risks, probability/impact analysis, mitigation strategies, and monitoring plan. Include both quantitative and qualitative factors.",
        category: "finance"
    },
    {
        title: "Financial Report Summary",
        content: "Summarize this financial report/statement highlighting: key performance indicators, significant changes, areas of concern, positive trends, and actionable insights. Make it accessible for [technical/non-technical] audience.",
        category: "finance"
    }
];