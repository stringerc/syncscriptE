# 🦞 OPENCLAW × SYNCSCRIPT: IMPLEMENTATION PLAN

**Date**: February 10, 2026  
**Status**: Ready to implement (Option A: Full Access)  
**Based on**: OPENCLAW_SYNCSCRIPT_INTEGRATION_RESEARCH.md (65,000 words)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNCSCRIPT ECOSYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐         ┌──────────────────────┐ │
│  │   VERCEL (Frontend)  │         │  EC2 (OpenClaw)      │ │
│  │  syncscript.app      │◄───────►│  3.148.233.23        │ │
│  │                      │  APIs   │                      │ │
│  │  - React/TypeScript  │         │  - DeepSeek LLM      │ │
│  │  - Tailwind CSS      │         │  - Custom Skills     │ │
│  │  - User Interface    │         │  - Agent Engine      │ │
│  └──────────┬───────────┘         └──────────┬───────────┘ │
│             │                                │             │
│             │                                │             │
│             ▼                                ▼             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         SUPABASE (Backend + Database)               │  │
│  │         kwhnrlzibgfedtxpkbgb.supabase.co            │  │
│  │                                                     │  │
│  │  - Postgres DB (tasks, goals, energy, users)       │  │
│  │  - Edge Functions (Hono server)                    │  │
│  │  - Auth (email/password, social)                   │  │
│  │  - Storage (files, images)                         │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Insight**: SyncScript ↔ OpenClaw communicate via **Supabase Edge Functions** as the bridge.

---

## 📊 IMPLEMENTATION STRATEGY (Based on Research Doc)

### Research Document Breakdown (65,000 words total)

**PART 1: User-Facing AI** (25,000 words)
- 7 Agent architecture (Scout, Planner, Executor, Energy, Goals, Team, Insights)
- 5 Revolutionary strategies
- ClawHub skills integration

**PART 2: Code Maintenance AI** (12,000 words)
- 6 Development agents (Guardian, Optimizer, Architect, Quality, Security, Docs)
- Self-healing architecture
- Continuous development pipeline

**PART 3: Implementation** (8,000 words)
- Technical integration guide
- Phase 1-4 roadmap
- Expected outcomes

**PART 5: Advanced Capabilities** (28,000 words)
- 15 revolutionary features
- Adaptive onboarding
- Emotional intelligence
- Hyper-personalization
- Decision intelligence
- etc.

### Our Prioritization Matrix

**Tier 1: Core Intelligence** (Week 1-2) ← **WE START HERE**
- ✅ AI Assistant chatbot (conversational interface)
- ✅ Scout Agent (observes user, generates suggestions)
- ✅ Task creation from natural language
- ✅ Basic energy-aware insights
- **Value**: Immediate AI capabilities, user engagement
- **Effort**: Medium (requires custom skills, API bridge)

**Tier 2: Autonomous Actions** (Week 3-4)
- ✅ Planner Agent (optimizes schedules)
- ✅ Executor Agent (creates tasks autonomously with confirmation)
- ✅ Multi-agent coordination
- ✅ Energy-based scheduling
- **Value**: Real productivity gains, competitive edge
- **Effort**: High (complex agent workflows)

**Tier 3: Advanced User Features** (Week 5-8)
- ✅ Emotional Intelligence (stress detection, wellbeing)
- ✅ Crisis Management (emergency mode)
- ✅ Predictive Planning (90-day forecasting)
- ✅ Natural Language Everything (voice control)
- **Value**: Revolutionary user experience
- **Effort**: Very High (new UI, ML models)

**Tier 4: Code Maintenance AI** (Week 9-12)
- ✅ Guardian Agent (bug detection, auto-fix)
- ✅ Optimizer Agent (performance monitoring)
- ✅ Self-healing architecture
- **Value**: Autonomous development, 925% ROI
- **Effort**: Very High (requires deep codebase integration)

**Tier 5: Ecosystem Features** (Week 13+)
- ✅ Social/Community features
- ✅ Financial intelligence
- ✅ Learning platform
- ✅ Cross-platform omnipresence
- **Value**: Complete life OS, network effects
- **Effort**: Extreme (separate products)

---

## 🎯 PHASE 1: CORE INTELLIGENCE (Next 2 Weeks)

### Goal
**Get AI working in SyncScript**: Users can chat with AI, get task suggestions, see insights.

### Deliverables

**1. OpenClaw Custom Skills** (4 skills)
```
syncscript-context-fetcher     → Fetches user data from Supabase
syncscript-task-suggester      → Analyzes context, suggests tasks
syncscript-task-creator        → Creates tasks in database
syncscript-insights-generator  → Generates productivity insights
```

**2. Supabase API Bridge** (1 new Edge Function)
```
/functions/v1/make-server-57781ad9/openclaw/execute
  → Receives commands from OpenClaw
  → Executes database operations
  → Returns results to OpenClaw
```

**3. Frontend Components** (3 new components)
```
<AIAssistantPanel />     → Chat interface with OpenClaw
<AISuggestionCard />     → Displays AI-generated suggestions
<AIInsightsWidget />     → Shows productivity insights
```

**4. Scout Agent Configuration**
```yaml
Agent: syncscript-scout
Model: deepseek-chat
Skills: [context-fetcher, task-suggester, insights-generator]
Triggers: [user-message, daily-6am, task-completed]
Memory: Long-term (user preferences, patterns)
```

### Success Criteria
- ✅ User can chat with AI in SyncScript
- ✅ AI suggests 3-5 relevant tasks based on context
- ✅ User can accept/dismiss suggestions (1-click)
- ✅ AI generates weekly insights
- ✅ Response time < 3 seconds
- ✅ Cost < $0.50/user/month (DeepSeek)

---

## 🛠️ TECHNICAL IMPLEMENTATION (Phase 1)

### Step 1: Create Custom OpenClaw Skills (Day 1-2)

**Location**: `/home/ubuntu/.openclaw/skills/syncscript/`

**Skill 1: Context Fetcher**
```typescript
// File: /home/ubuntu/.openclaw/skills/syncscript/context-fetcher.ts

import { z } from 'zod';

export const skill = {
  id: 'syncscript-context-fetcher',
  name: 'SyncScript Context Fetcher',
  description: 'Fetches user tasks, goals, energy data, and calendar from SyncScript',
  version: '1.0.0',
  
  parameters: z.object({
    userId: z.string().uuid(),
    dataTypes: z.array(z.enum(['tasks', 'goals', 'energy', 'calendar', 'analytics'])),
    timeRange: z.enum(['today', 'week', 'month', 'quarter']).optional()
  }),
  
  async execute({ userId, dataTypes, timeRange = 'week' }) {
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const context = {};
    
    // Fetch tasks
    if (dataTypes.includes('tasks')) {
      const tasksRes = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      context.tasks = await tasksRes.json();
    }
    
    // Fetch goals
    if (dataTypes.includes('goals')) {
      const goalsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/goals?user_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      context.goals = await goalsRes.json();
    }
    
    // Fetch energy data
    if (dataTypes.includes('energy')) {
      const energyRes = await fetch(
        `${SUPABASE_URL}/rest/v1/energy_logs?user_id=eq.${userId}&select=*&order=timestamp.desc&limit=30`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      context.energyData = await energyRes.json();
    }
    
    return {
      success: true,
      userId,
      context,
      timestamp: new Date().toISOString()
    };
  }
};
```

**Skill 2: Task Suggester**
```typescript
// File: /home/ubuntu/.openclaw/skills/syncscript/task-suggester.ts

import { z } from 'zod';

export const skill = {
  id: 'syncscript-task-suggester',
  name: 'SyncScript Task Suggester',
  description: 'Analyzes user context and suggests relevant tasks using AI',
  version: '1.0.0',
  
  parameters: z.object({
    userContext: z.object({
      tasks: z.array(z.any()),
      goals: z.array(z.any()),
      energyData: z.array(z.any()).optional(),
      recentActivity: z.string().optional()
    }),
    count: z.number().min(1).max(10).default(5)
  }),
  
  async execute({ userContext, count = 5 }, { ai }) {
    const prompt = `
You are a productivity AI assistant analyzing a user's SyncScript data.

Current Context:
- Active Tasks: ${userContext.tasks.length}
- Active Goals: ${userContext.goals.length}
- Recent Energy Pattern: ${summarizeEnergy(userContext.energyData)}

User's Tasks:
${JSON.stringify(userContext.tasks.slice(0, 10), null, 2)}

User's Goals:
${JSON.stringify(userContext.goals, null, 2)}

Based on this context, suggest ${count} actionable tasks that would:
1. Move the user toward their goals
2. Fill gaps in their current task list
3. Match their energy patterns
4. Follow productivity best practices

For each suggestion, provide:
- title: Clear, actionable task title
- priority: critical/high/medium/low
- estimatedMinutes: Realistic time estimate
- reasoning: Why this task is suggested
- goalId: Which goal this supports (if applicable)
- energyLevel: required (high/medium/low)

Return as JSON array.
`;

    const response = await ai.complete(prompt, {
      model: 'deepseek-chat',
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const suggestions = JSON.parse(response.content);
    
    return {
      success: true,
      suggestions,
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
  }
};

function summarizeEnergy(energyData) {
  if (!energyData || energyData.length === 0) return 'No data';
  
  const avg = energyData.reduce((sum, log) => sum + log.level, 0) / energyData.length;
  const trend = energyData[0].level > energyData[energyData.length - 1].level ? 'increasing' : 'decreasing';
  
  return `Average ${avg.toFixed(0)}%, ${trend} trend`;
}
```

**Skill 3: Task Creator**
```typescript
// File: /home/ubuntu/.openclaw/skills/syncscript/task-creator.ts

import { z } from 'zod';

export const skill = {
  id: 'syncscript-task-creator',
  name: 'SyncScript Task Creator',
  description: 'Creates tasks in SyncScript database',
  version: '1.0.0',
  
  parameters: z.object({
    userId: z.string().uuid(),
    task: z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      category: z.string().optional(),
      dueDate: z.string().optional(), // ISO date
      estimatedMinutes: z.number().optional(),
      goalId: z.string().uuid().optional(),
      tags: z.array(z.string()).optional()
    })
  }),
  
  async execute({ userId, task }) {
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const newTask = {
      user_id: userId,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category || 'General',
      due_date: task.dueDate,
      estimated_minutes: task.estimatedMinutes,
      goal_id: task.goalId,
      tags: task.tags || [],
      status: 'pending',
      created_by: 'ai-agent',
      created_at: new Date().toISOString()
    };
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newTask)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }
    
    const createdTask = await response.json();
    
    return {
      success: true,
      task: createdTask[0],
      message: `Created task: "${task.title}"`
    };
  }
};
```

**Skill 4: Insights Generator**
```typescript
// File: /home/ubuntu/.openclaw/skills/syncscript/insights-generator.ts

import { z } from 'zod';

export const skill = {
  id: 'syncscript-insights-generator',
  name: 'SyncScript Insights Generator',
  description: 'Generates productivity insights from user data using AI',
  version: '1.0.0',
  
  parameters: z.object({
    userContext: z.object({
      tasks: z.array(z.any()),
      goals: z.array(z.any()),
      energyData: z.array(z.any()).optional(),
      completionStats: z.object({
        totalCompleted: z.number(),
        totalCreated: z.number(),
        avgCompletionTime: z.number()
      }).optional()
    }),
    insightTypes: z.array(z.enum([
      'productivity', 
      'energy', 
      'goal-progress', 
      'time-management',
      'patterns'
    ])).default(['productivity', 'energy', 'goal-progress'])
  }),
  
  async execute({ userContext, insightTypes }, { ai }) {
    const prompt = `
You are a productivity analytics AI for SyncScript.

Analyze this user's data and generate ${insightTypes.length} specific, actionable insights:

User Data:
- Tasks: ${userContext.tasks.length} active, ${userContext.completionStats?.totalCompleted || 0} completed
- Completion Rate: ${calculateCompletionRate(userContext)}%
- Goals: ${userContext.goals.length} active
- Energy Pattern: ${summarizeEnergy(userContext.energyData)}

Focus areas: ${insightTypes.join(', ')}

For each insight, provide:
- type: ${insightTypes.join('|')}
- title: Brief, engaging headline
- description: 2-3 sentences explaining the insight
- recommendation: Specific action the user should take
- impact: high|medium|low (how important is this?)
- data: Supporting numbers/facts

Return as JSON array of insights.
`;

    const response = await ai.complete(prompt, {
      model: 'deepseek-chat',
      temperature: 0.6,
      max_tokens: 1500
    });
    
    const insights = JSON.parse(response.content);
    
    return {
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    };
  }
};

function calculateCompletionRate(context) {
  const { totalCompleted = 0, totalCreated = 1 } = context.completionStats || {};
  return Math.round((totalCompleted / totalCreated) * 100);
}

function summarizeEnergy(energyData) {
  if (!energyData || energyData.length === 0) return 'No energy data';
  const avg = energyData.reduce((sum, log) => sum + log.level, 0) / energyData.length;
  return `Average ${avg.toFixed(0)}%`;
}
```

---

### Step 2: Configure OpenClaw Agent (Day 2)

**File**: `/home/ubuntu/.openclaw/agents/syncscript-scout.yaml`

```yaml
id: syncscript-scout
name: SyncScript Scout Agent
description: Observes user behavior and generates intelligent suggestions
version: 1.0.0

# AI Model Configuration
model:
  provider: openrouter
  model: openai-compatible/deepseek-chat
  temperature: 0.7
  max_tokens: 2000
  fallback:
    provider: openrouter
    model: vercel-ai-gateway/anthropic/claude-opus-4.6

# Skills Available to Agent
skills:
  - syncscript-context-fetcher
  - syncscript-task-suggester
  - syncscript-task-creator
  - syncscript-insights-generator
  - web-browsing  # Built-in skill
  - filesystem-tools  # Built-in skill

# Triggers (When agent runs)
triggers:
  # User sends message in chat
  - type: webhook
    name: user-message
    endpoint: /api/agents/syncscript-scout/message
    
  # Daily morning briefing
  - type: cron
    name: daily-briefing
    schedule: "0 6 * * *"  # 6 AM daily
    action: generate-daily-plan
    
  # When user completes a task
  - type: event
    name: task-completed
    listen: syncscript.task.completed
    action: analyze-and-encourage

# Memory Configuration
memory:
  enabled: true
  type: long-term
  storage: ~/.openclaw/agents/syncscript-scout/memory.json
  retention: 90 days
  
  # What to remember
  track:
    - user_preferences
    - successful_suggestions
    - dismissed_suggestions
    - productivity_patterns
    - energy_patterns
    - goal_priorities

# Personality & Tone
personality:
  tone: friendly, encouraging, professional
  style: concise but thorough
  emoji_usage: moderate
  formality: casual-professional

# Constraints
constraints:
  max_suggestions_per_request: 5
  max_tasks_created_per_day: 10
  require_confirmation: true  # Always ask before creating tasks
  
# Cost Controls
cost_controls:
  max_tokens_per_request: 2000
  max_requests_per_user_per_day: 50
  daily_budget: 5.00  # $5/day max

# Logging
logging:
  level: info
  file: ~/.openclaw/agents/syncscript-scout/agent.log
  rotate: daily
```

---

### Step 3: Create Supabase Edge Function Bridge (Day 3)

**File**: Create new Supabase Edge Function via Supabase Dashboard

**Function Name**: `openclaw-bridge`  
**Path**: `/functions/v1/make-server-57781ad9/openclaw/execute`

```typescript
// File: supabase/functions/openclaw-bridge/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENCLAW_URL = 'http://3.148.233.23:18789';
const OPENCLAW_TOKEN = Deno.env.get('OPENCLAW_TOKEN');

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type'
      }
    });
  }

  try {
    const { action, params, userId } = await req.json();
    
    // Verify user authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Route to OpenClaw based on action
    let result;
    
    switch (action) {
      case 'generate-suggestions':
        result = await generateSuggestions(userId, params);
        break;
        
      case 'create-task':
        result = await createTask(userId, params);
        break;
        
      case 'generate-insights':
        result = await generateInsights(userId, params);
        break;
        
      case 'chat':
        result = await chat(userId, params);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('OpenClaw bridge error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSuggestions(userId: string, params: any) {
  // Call OpenClaw to execute task-suggester skill
  const response = await fetch(`${OPENCLAW_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent: 'syncscript-scout',
      skill: 'syncscript-task-suggester',
      params: {
        userContext: params.context,
        count: params.count || 5
      }
    })
  });
  
  return await response.json();
}

async function createTask(userId: string, params: any) {
  const response = await fetch(`${OPENCLAW_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent: 'syncscript-scout',
      skill: 'syncscript-task-creator',
      params: {
        userId,
        task: params.task
      }
    })
  });
  
  return await response.json();
}

async function generateInsights(userId: string, params: any) {
  const response = await fetch(`${OPENCLAW_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent: 'syncscript-scout',
      skill: 'syncscript-insights-generator',
      params: {
        userContext: params.context,
        insightTypes: params.types || ['productivity', 'energy', 'goal-progress']
      }
    })
  });
  
  return await response.json();
}

async function chat(userId: string, params: any) {
  // Send message to OpenClaw agent for conversational response
  const response = await fetch(`${OPENCLAW_URL}/api/agents/syncscript-scout/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      message: params.message,
      context: params.context
    })
  });
  
  return await response.json();
}
```

---

### Step 4: Update Frontend (Day 4-5)

**File 1**: Update `/contexts/OpenClawContext.tsx`

```typescript
// Remove all mock data, add real OpenClaw integration

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const OPENCLAW_API = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw`;

interface OpenClawContextType {
  generateTaskSuggestions: (context: UserContext) => Promise<TaskSuggestion[]>;
  createTask: (task: TaskInput) => Promise<Task>;
  generateInsights: (types: InsightType[]) => Promise<Insight[]>;
  chat: (message: string) => Promise<ChatResponse>;
  loading: boolean;
  error: string | null;
}

export const OpenClawContext = createContext<OpenClawContextType | undefined>(undefined);

export function OpenClawProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const callOpenClaw = async (action: string, params: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${OPENCLAW_API}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          params,
          userId: 'current-user-id' // Get from auth context
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenClaw error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const generateTaskSuggestions = async (context: UserContext): Promise<TaskSuggestion[]> => {
    const result = await callOpenClaw('generate-suggestions', { context, count: 5 });
    return result.suggestions || [];
  };
  
  const createTask = async (task: TaskInput): Promise<Task> => {
    const result = await callOpenClaw('create-task', { task });
    return result.task;
  };
  
  const generateInsights = async (types: InsightType[]): Promise<Insight[]> => {
    const result = await callOpenClaw('generate-insights', { types });
    return result.insights || [];
  };
  
  const chat = async (message: string): Promise<ChatResponse> => {
    const result = await callOpenClaw('chat', { message });
    return result;
  };
  
  return (
    <OpenClawContext.Provider value={{
      generateTaskSuggestions,
      createTask,
      generateInsights,
      chat,
      loading,
      error
    }}>
      {children}
    </OpenClawContext.Provider>
  );
}

export function useOpenClaw() {
  const context = useContext(OpenClawContext);
  if (!context) {
    throw new Error('useOpenClaw must be used within OpenClawProvider');
  }
  return context;
}
```

**File 2**: Create `/components/AIAssistantPanel.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useOpenClaw } from '../contexts/OpenClawContext';
import { motion } from 'motion/react';

export function AIAssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI productivity assistant. I can help you create tasks, plan your day, and get insights. What would you like to do?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const { chat, loading } = useOpenClaw();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await chat(input);
      
      const aiMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-100">AI Assistant</h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg px-4 py-2 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📅 TIMELINE & DELIVERABLES

### **Day 1-2** (16 hours): OpenClaw Skills Setup
- ✅ SSH into EC2 server
- ✅ Create 4 custom skills (context-fetcher, task-suggester, task-creator, insights-generator)
- ✅ Configure syncscript-scout agent
- ✅ Test skills locally
- ✅ Deploy skills to OpenClaw

### **Day 3** (8 hours): Supabase Bridge
- ✅ Create openclaw-bridge Edge Function
- ✅ Configure environment variables (OPENCLAW_TOKEN)
- ✅ Test API communication OpenClaw ↔ Supabase
- ✅ Deploy to production

### **Day 4-5** (16 hours): Frontend Integration
- ✅ Update OpenClawContext with real API calls
- ✅ Build AIAssistantPanel component
- ✅ Update AISuggestionsCard to use real data
- ✅ Build AIInsightsWidget
- ✅ Add AI Assistant to Dashboard layout
- ✅ Test end-to-end user flow

### **Day 6** (8 hours): Testing & Polish
- ✅ User acceptance testing
- ✅ Fix bugs
- ✅ Performance optimization (response time, caching)
- ✅ Cost monitoring setup
- ✅ Documentation

### **Day 7** (4 hours): Deploy & Monitor
- ✅ Deploy to production (Vercel)
- ✅ Monitor logs and errors
- ✅ Validate DeepSeek costs
- ✅ Prepare for Phase 2

---

## 🚀 READY TO START

**I have all the access I need**:
- ✅ SSH: `ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23`
- ✅ OpenClaw installed on EC2
- ✅ SyncScript on Vercel (GitHub repo)
- ✅ Supabase credentials available
- ✅ DeepSeek configured

**Next Step**: I'll start implementing Phase 1 immediately. Expected completion: 7 days.

**Question: Do you want me to start now, or do you want to review this plan first?**
