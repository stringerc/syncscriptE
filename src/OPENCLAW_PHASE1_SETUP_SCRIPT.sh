#!/bin/bash

# ============================================================================
# OPENCLAW + SYNCSCRIPT: PHASE 1 SETUP SCRIPT
# ============================================================================
# 
# This script sets up the OpenClaw skills on the EC2 server
# Run this on the EC2 instance: ubuntu@3.148.233.23
#
# Usage:
#   chmod +x setup-openclaw-skills.sh
#   ./setup-openclaw-skills.sh
#
# ============================================================================

set -e  # Exit on error

echo "🦞 OpenClaw + SyncScript: Phase 1 Setup"
echo "========================================"
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================

SKILLS_DIR="$HOME/.openclaw/skills/syncscript"
BACKUP_DIR="$HOME/.openclaw/backups/$(date +%Y%m%d_%H%M%S)"

# ============================================================================
# BACKUP EXISTING SKILLS (IF ANY)
# ============================================================================

if [ -d "$SKILLS_DIR" ]; then
  echo "📦 Backing up existing skills to $BACKUP_DIR..."
  mkdir -p "$BACKUP_DIR"
  cp -r "$SKILLS_DIR" "$BACKUP_DIR/"
  echo "✅ Backup complete"
  echo ""
fi

# ============================================================================
# CREATE SKILLS DIRECTORY
# ============================================================================

echo "📁 Creating skills directory: $SKILLS_DIR"
mkdir -p "$SKILLS_DIR"
echo "✅ Directory created"
echo ""

# ============================================================================
# SKILL 1: CONTEXT FETCHER
# ============================================================================

echo "🔧 Creating Skill 1: syncscript-context-fetcher..."

cat > "$SKILLS_DIR/context-fetcher.ts" << 'EOF'
/**
 * SyncScript Context Fetcher
 * Fetches user data from Supabase database
 */

export const skill = {
  id: 'syncscript-context-fetcher',
  name: 'SyncScript Context Fetcher',
  description: 'Fetches user tasks, goals, energy data, and calendar from SyncScript',
  version: '1.0.0',
  
  // Input parameters
  parameters: {
    userId: {
      type: 'string',
      required: true,
      description: 'User ID (UUID)'
    },
    dataTypes: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['tasks', 'goals', 'energy', 'calendar', 'analytics']
      },
      required: true,
      description: 'Types of data to fetch'
    },
    timeRange: {
      type: 'string',
      enum: ['today', 'week', 'month', 'quarter'],
      default: 'week',
      description: 'Time range for data'
    }
  },
  
  // Execute function
  async execute(params: any): Promise<any> {
    const { userId, dataTypes, timeRange = 'week' } = params;
    
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!SUPABASE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    
    const context: any = {};
    
    try {
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
        
        if (tasksRes.ok) {
          context.tasks = await tasksRes.json();
        }
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
        
        if (goalsRes.ok) {
          context.goals = await goalsRes.json();
        }
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
        
        if (energyRes.ok) {
          context.energyData = await energyRes.json();
        }
      }
      
      return {
        success: true,
        userId,
        context,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('[Context Fetcher] Error:', error);
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }
};

// Export for OpenClaw to register
export default skill;
EOF

echo "✅ Skill 1 created: context-fetcher.ts"
echo ""

# ============================================================================
# SKILL 2: TASK SUGGESTER
# ============================================================================

echo "🔧 Creating Skill 2: syncscript-task-suggester..."

cat > "$SKILLS_DIR/task-suggester.ts" << 'EOF'
/**
 * SyncScript Task Suggester
 * Uses AI to analyze user context and suggest relevant tasks
 */

export const skill = {
  id: 'syncscript-task-suggester',
  name: 'SyncScript Task Suggester',
  description: 'Analyzes user context and suggests relevant tasks using AI',
  version: '1.0.0',
  
  parameters: {
    userContext: {
      type: 'object',
      required: true,
      description: 'User context with tasks, goals, energy data'
    },
    count: {
      type: 'number',
      default: 5,
      min: 1,
      max: 10,
      description: 'Number of suggestions to generate'
    }
  },
  
  async execute(params: any, context: any): Promise<any> {
    const { userContext, count = 5 } = params;
    
    // Build prompt for AI
    const prompt = buildSuggestionPrompt(userContext, count);
    
    try {
      // Call AI (DeepSeek via OpenRouter)
      const response = await callAI(prompt);
      
      // Parse AI response
      const suggestions = parseAISuggestions(response);
      
      return {
        success: true,
        suggestions,
        confidence: 0.85,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('[Task Suggester] Error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }
};

function buildSuggestionPrompt(userContext: any, count: number): string {
  const { tasks = [], goals = [], energyData = [] } = userContext;
  
  const avgEnergy = energyData.length > 0
    ? energyData.reduce((sum: number, log: any) => sum + (log.level || 0), 0) / energyData.length
    : 50;
  
  return `You are a productivity AI assistant analyzing a user's SyncScript data.

Current Context:
- Active Tasks: ${tasks.length}
- Active Goals: ${goals.length}
- Average Energy: ${avgEnergy.toFixed(0)}%

User's Recent Tasks:
${JSON.stringify(tasks.slice(0, 5), null, 2)}

User's Goals:
${JSON.stringify(goals, null, 2)}

Based on this context, suggest ${count} actionable tasks that would:
1. Move the user toward their goals
2. Fill gaps in their current task list
3. Match their energy patterns
4. Follow productivity best practices

For each suggestion, provide a JSON object with:
- title: Clear, actionable task title
- priority: critical/high/medium/low
- estimatedMinutes: Realistic time estimate
- reasoning: Why this task is suggested (1 sentence)
- goalId: Which goal this supports (if applicable)
- energyLevel: required (high/medium/low)

Return ONLY a JSON array of suggestion objects, no other text.`;
}

async function callAI(prompt: string): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://syncscript.app',
      'X-Title': 'SyncScript'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function parseAISuggestions(aiResponse: string): any[] {
  try {
    // Extract JSON from AI response (it might have markdown code blocks)
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Task Suggester] No JSON array found in AI response');
      return [];
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);
    return Array.isArray(suggestions) ? suggestions : [];
    
  } catch (error) {
    console.error('[Task Suggester] Failed to parse AI response:', error);
    return [];
  }
}

export default skill;
EOF

echo "✅ Skill 2 created: task-suggester.ts"
echo ""

# ============================================================================
# SKILL 3: TASK CREATOR
# ============================================================================

echo "🔧 Creating Skill 3: syncscript-task-creator..."

cat > "$SKILLS_DIR/task-creator.ts" << 'EOF'
/**
 * SyncScript Task Creator
 * Creates tasks in SyncScript database
 */

export const skill = {
  id: 'syncscript-task-creator',
  name: 'SyncScript Task Creator',
  description: 'Creates tasks in SyncScript database',
  version: '1.0.0',
  
  parameters: {
    userId: {
      type: 'string',
      required: true,
      description: 'User ID (UUID)'
    },
    task: {
      type: 'object',
      required: true,
      properties: {
        title: { type: 'string', required: true },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], required: true },
        category: { type: 'string' },
        dueDate: { type: 'string' },
        estimatedMinutes: { type: 'number' },
        goalId: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  
  async execute(params: any): Promise<any> {
    const { userId, task } = params;
    
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!SUPABASE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    
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
    
    try {
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
        const errorText = await response.text();
        throw new Error(`Supabase error: ${response.status} ${errorText}`);
      }
      
      const createdTasks = await response.json();
      const createdTask = Array.isArray(createdTasks) ? createdTasks[0] : createdTasks;
      
      return {
        success: true,
        task: createdTask,
        message: `Created task: "${task.title}"`
      };
      
    } catch (error: any) {
      console.error('[Task Creator] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default skill;
EOF

echo "✅ Skill 3 created: task-creator.ts"
echo ""

# ============================================================================
# SKILL 4: INSIGHTS GENERATOR
# ============================================================================

echo "🔧 Creating Skill 4: syncscript-insights-generator..."

cat > "$SKILLS_DIR/insights-generator.ts" << 'EOF'
/**
 * SyncScript Insights Generator
 * Generates productivity insights from user data using AI
 */

export const skill = {
  id: 'syncscript-insights-generator',
  name: 'SyncScript Insights Generator',
  description: 'Generates productivity insights from user data using AI',
  version: '1.0.0',
  
  parameters: {
    userContext: {
      type: 'object',
      required: true,
      description: 'User context with tasks, goals, energy data'
    },
    insightTypes: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['productivity', 'energy', 'goal-progress', 'time-management', 'patterns']
      },
      default: ['productivity', 'energy', 'goal-progress'],
      description: 'Types of insights to generate'
    }
  },
  
  async execute(params: any): Promise<any> {
    const { userContext, insightTypes = ['productivity', 'energy', 'goal-progress'] } = params;
    
    const prompt = buildInsightsPrompt(userContext, insightTypes);
    
    try {
      const response = await callAI(prompt);
      const insights = parseInsights(response);
      
      return {
        success: true,
        insights,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('[Insights Generator] Error:', error);
      return {
        success: false,
        error: error.message,
        insights: []
      };
    }
  }
};

function buildInsightsPrompt(userContext: any, insightTypes: string[]): string {
  const { tasks = [], goals = [], energyData = [], completionStats = {} } = userContext;
  
  const completionRate = completionStats.totalCompleted && completionStats.totalCreated
    ? Math.round((completionStats.totalCompleted / completionStats.totalCreated) * 100)
    : 0;
  
  const avgEnergy = energyData.length > 0
    ? energyData.reduce((sum: number, log: any) => sum + (log.level || 0), 0) / energyData.length
    : 0;
  
  return `You are a productivity analytics AI for SyncScript.

Analyze this user's data and generate ${insightTypes.length} specific, actionable insights:

User Data:
- Tasks: ${tasks.length} active, ${completionStats.totalCompleted || 0} completed
- Completion Rate: ${completionRate}%
- Goals: ${goals.length} active
- Average Energy: ${avgEnergy.toFixed(0)}%

Focus areas: ${insightTypes.join(', ')}

For each insight, provide a JSON object with:
- type: one of ${insightTypes.join('|')}
- title: Brief, engaging headline
- description: 2-3 sentences explaining the insight
- recommendation: Specific action the user should take
- impact: high|medium|low (how important is this?)
- data: Supporting numbers/facts

Return ONLY a JSON array of insight objects, no other text.`;
}

async function callAI(prompt: string): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://syncscript.app',
      'X-Title': 'SyncScript'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1500
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function parseInsights(aiResponse: string): any[] {
  try {
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Insights Generator] No JSON array found in AI response');
      return [];
    }
    
    const insights = JSON.parse(jsonMatch[0]);
    return Array.isArray(insights) ? insights : [];
    
  } catch (error) {
    console.error('[Insights Generator] Failed to parse AI response:', error);
    return [];
  }
}

export default skill;
EOF

echo "✅ Skill 4 created: insights-generator.ts"
echo ""

# ============================================================================
# CONFIGURE ENVIRONMENT VARIABLES
# ============================================================================

echo "🔐 Setting up environment variables..."

# Check if .env file exists
if [ ! -f "$HOME/.openclaw/.env" ]; then
  echo "Creating .env file..."
  cat > "$HOME/.openclaw/.env" << EOF
# Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenRouter Configuration
OPENROUTER_API_KEY=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
EOF
  echo "⚠️  IMPORTANT: Edit $HOME/.openclaw/.env and add your SUPABASE_SERVICE_ROLE_KEY"
else
  echo "✅ .env file already exists"
fi

echo ""

# ============================================================================
# REGISTER SKILLS WITH OPENCLAW
# ============================================================================

echo "📋 To register these skills with OpenClaw, run:"
echo ""
echo "  cd $SKILLS_DIR"
echo "  openclaw skills register ./context-fetcher.ts"
echo "  openclaw skills register ./task-suggester.ts"
echo "  openclaw skills register ./task-creator.ts"
echo "  openclaw skills register ./insights-generator.ts"
echo ""
echo "Then restart OpenClaw:"
echo "  openclaw restart"
echo ""

# ============================================================================
# COMPLETE
# ============================================================================

echo "✅ Phase 1 Setup Complete!"
echo ""
echo "Skills created in: $SKILLS_DIR"
echo "  - context-fetcher.ts"
echo "  - task-suggester.ts"
echo "  - task-creator.ts"
echo "  - insights-generator.ts"
echo ""
echo "Next steps:"
echo "1. Edit $HOME/.openclaw/.env with your SUPABASE_SERVICE_ROLE_KEY"
echo "2. Register the skills (commands above)"
echo "3. Test the integration"
echo ""
echo "🦞 Ready to make SyncScript intelligent! 🚀"
