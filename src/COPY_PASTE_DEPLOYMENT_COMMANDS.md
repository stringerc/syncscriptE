# 📋 COPY-PASTE DEPLOYMENT COMMANDS

**Quick reference: Copy these commands exactly as-is**

---

## 🔐 **STEP 1: Get Your Supabase Service Role Key**

1. Open: https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/settings/api
2. Scroll to "Project API keys"
3. Copy the **service_role** key (the long one, NOT the anon key)
4. Save it somewhere - you'll need it in Step 3

---

## 🚀 **STEP 2: SSH into EC2 and Run Setup Script**

### **2.1: Connect to EC2**

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
```

### **2.2: Create Setup Script**

Copy-paste this ENTIRE block:

```bash
cat > setup-openclaw.sh << 'SCRIPT_END'
#!/bin/bash
set -e
echo "🦞 OpenClaw + SyncScript: Phase 1 Setup"
echo "========================================"
SKILLS_DIR="$HOME/.openclaw/skills/syncscript"
BACKUP_DIR="$HOME/.openclaw/backups/$(date +%Y%m%d_%H%M%S)"
if [ -d "$SKILLS_DIR" ]; then
  echo "📦 Backing up existing skills..."
  mkdir -p "$BACKUP_DIR"
  cp -r "$SKILLS_DIR" "$BACKUP_DIR/"
fi
echo "📁 Creating skills directory..."
mkdir -p "$SKILLS_DIR"

# Skill 1: Context Fetcher
cat > "$SKILLS_DIR/context-fetcher.ts" << 'EOF'
export const skill = {
  id: 'syncscript-context-fetcher',
  name: 'SyncScript Context Fetcher',
  description: 'Fetches user tasks, goals, energy data from SyncScript',
  version: '1.0.0',
  parameters: {
    userId: { type: 'string', required: true },
    dataTypes: { type: 'array', items: { type: 'string' }, required: true },
    timeRange: { type: 'string', default: 'week' }
  },
  async execute(params) {
    const { userId, dataTypes, timeRange = 'week' } = params;
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const context = {};
    try {
      if (dataTypes.includes('tasks')) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${userId}&select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (res.ok) context.tasks = await res.json();
      }
      if (dataTypes.includes('goals')) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/goals?user_id=eq.${userId}&select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (res.ok) context.goals = await res.json();
      }
      if (dataTypes.includes('energy')) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/energy_logs?user_id=eq.${userId}&select=*&order=timestamp.desc&limit=30`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (res.ok) context.energyData = await res.json();
      }
      return { success: true, userId, context, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message, userId };
    }
  }
};
export default skill;
EOF

echo "✅ Skill 1 created: context-fetcher.ts"

# Skill 2: Task Suggester
cat > "$SKILLS_DIR/task-suggester.ts" << 'EOF'
export const skill = {
  id: 'syncscript-task-suggester',
  name: 'SyncScript Task Suggester',
  description: 'AI task suggestions using DeepSeek',
  version: '1.0.0',
  parameters: {
    userContext: { type: 'object', required: true },
    count: { type: 'number', default: 5, min: 1, max: 10 }
  },
  async execute(params) {
    const { userContext, count = 5 } = params;
    const { tasks = [], goals = [], energyData = [] } = userContext;
    const avgEnergy = energyData.length > 0 ? energyData.reduce((s, l) => s + (l.level || 0), 0) / energyData.length : 50;
    const prompt = `You are a productivity AI. Analyze this data and suggest ${count} tasks (JSON array only):
Context: ${tasks.length} tasks, ${goals.length} goals, ${avgEnergy.toFixed(0)}% energy
Tasks: ${JSON.stringify(tasks.slice(0, 5))}
Goals: ${JSON.stringify(goals)}
Return JSON: [{"title":"...","priority":"high|medium|low","estimatedMinutes":60,"reasoning":"...","goalId":"...","energyLevel":"high|medium|low"}]`;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://syncscript.app'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      const data = await res.json();
      const aiResponse = data.choices[0].message.content;
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      return { success: true, suggestions, confidence: 0.85, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message, suggestions: [] };
    }
  }
};
export default skill;
EOF

echo "✅ Skill 2 created: task-suggester.ts"

# Skill 3: Task Creator
cat > "$SKILLS_DIR/task-creator.ts" << 'EOF'
export const skill = {
  id: 'syncscript-task-creator',
  name: 'SyncScript Task Creator',
  description: 'Creates tasks in database',
  version: '1.0.0',
  parameters: {
    userId: { type: 'string', required: true },
    task: { type: 'object', required: true }
  },
  async execute(params) {
    const { userId, task } = params;
    const SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newTask)
      });
      const createdTasks = await res.json();
      const createdTask = Array.isArray(createdTasks) ? createdTasks[0] : createdTasks;
      return { success: true, task: createdTask, message: `Created: "${task.title}"` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
export default skill;
EOF

echo "✅ Skill 3 created: task-creator.ts"

# Skill 4: Insights Generator
cat > "$SKILLS_DIR/insights-generator.ts" << 'EOF'
export const skill = {
  id: 'syncscript-insights-generator',
  name: 'SyncScript Insights Generator',
  description: 'AI productivity insights',
  version: '1.0.0',
  parameters: {
    userContext: { type: 'object', required: true },
    insightTypes: { type: 'array', default: ['productivity', 'energy', 'goal-progress'] }
  },
  async execute(params) {
    const { userContext, insightTypes = ['productivity', 'energy'] } = params;
    const { tasks = [], goals = [], energyData = [], completionStats = {} } = userContext;
    const completionRate = completionStats.totalCompleted && completionStats.totalCreated
      ? Math.round((completionStats.totalCompleted / completionStats.totalCreated) * 100) : 0;
    const avgEnergy = energyData.length > 0 ? energyData.reduce((s, l) => s + (l.level || 0), 0) / energyData.length : 0;
    const prompt = `Productivity AI: Generate ${insightTypes.length} insights (JSON array only):
Data: ${tasks.length} tasks, ${completionRate}% completion, ${goals.length} goals, ${avgEnergy.toFixed(0)}% energy
Focus: ${insightTypes.join(', ')}
Return JSON: [{"type":"productivity|energy|goal-progress","title":"...","description":"2-3 sentences","recommendation":"specific action","impact":"high|medium|low","data":{}}]`;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://syncscript.app'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 1500
        })
      });
      const data = await res.json();
      const aiResponse = data.choices[0].message.content;
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      return { success: true, insights, generatedAt: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: error.message, insights: [] };
    }
  }
};
export default skill;
EOF

echo "✅ Skill 4 created: insights-generator.ts"

# Create .env if not exists
if [ ! -f "$HOME/.openclaw/.env" ]; then
  cat > "$HOME/.openclaw/.env" << EOF
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_KEY
OPENROUTER_API_KEY=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
EOF
  echo "⚠️  Created .env - EDIT IT with your Supabase key!"
fi

echo ""
echo "✅ Setup complete!"
echo "Skills in: $SKILLS_DIR"
echo ""
echo "NEXT: Edit ~/.openclaw/.env with your Supabase key, then:"
echo "  cd $SKILLS_DIR"
echo "  openclaw skills register ./context-fetcher.ts"
echo "  openclaw skills register ./task-suggester.ts"
echo "  openclaw skills register ./task-creator.ts"
echo "  openclaw skills register ./insights-generator.ts"
echo "  openclaw restart"
SCRIPT_END

chmod +x setup-openclaw.sh
```

### **2.3: Run Setup Script**

```bash
./setup-openclaw.sh
```

---

## 🔑 **STEP 3: Configure Environment Variables**

```bash
# Edit the .env file
nano ~/.openclaw/.env
```

**Replace `REPLACE_WITH_YOUR_KEY` with your actual Supabase service role key:**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_KEY_HERE
OPENROUTER_API_KEY=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
```

**Save**: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 📋 **STEP 4: Register Skills**

```bash
cd ~/.openclaw/skills/syncscript

openclaw skills register ./context-fetcher.ts
openclaw skills register ./task-suggester.ts
openclaw skills register ./task-creator.ts
openclaw skills register ./insights-generator.ts
```

**Verify:**

```bash
openclaw skills list | grep syncscript
```

**Should show 4 skills**

---

## 🔄 **STEP 5: Restart OpenClaw**

```bash
openclaw restart
```

**Check status:**

```bash
systemctl status openclaw
```

**Should say "active (running)"**

---

## 🌐 **STEP 6: Deploy Frontend**

**Exit EC2** (back to your Mac):

```bash
exit
```

**Push to GitHub:**

```bash
cd /path/to/your/syncscript/project

git add .
git commit -m "Phase 1: OpenClaw integration with real AI"
git push origin main
```

**Wait for Vercel to deploy** (~2 minutes)

---

## ✅ **STEP 7: Test**

### **Test 1: Health Check**

```bash
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health
```

**Expected**: `{"success":true,"openclawStatus":"connected"}`

### **Test 2: Chat**

```bash
curl -X POST https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me?","userId":"test"}'
```

**Expected**: JSON response with AI message

### **Test 3: Browser**

1. Open: https://syncscript.app
2. Navigate to AI Assistant
3. Send a message
4. Verify AI responds

---

## 🐛 **TROUBLESHOOTING COMMANDS**

### **If OpenClaw won't start:**

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
tail -f /tmp/openclaw/openclaw-*.log
```

### **If skills aren't registered:**

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
openclaw skills list
cd ~/.openclaw/skills/syncscript
openclaw skills register ./context-fetcher.ts
```

### **If environment variables aren't set:**

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
cat ~/.openclaw/.env
# Check both keys are set
```

---

## 📞 **STUCK? CHECK THESE DOCS**

- Full guide: `/OPENCLAW_PHASE1_DEPLOYMENT_GUIDE.md`
- All commands: `/OPENCLAW_COMMAND_CHEAT_SHEET.md`
- Troubleshooting: Deployment guide → "Troubleshooting" section

---

**Copy and paste these commands in order. Good luck! 🚀**
