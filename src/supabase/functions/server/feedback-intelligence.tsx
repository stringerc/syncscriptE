// =====================================================================
// FEEDBACK INTELLIGENCE SYSTEM
// AI-powered feedback analysis, clustering, and prioritization
// Research: MIT CSAIL, Stanford NLP, Mixpanel Product Analytics
// =====================================================================

import * as kv from './kv_store.tsx';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface FeedbackItem {
  id: string;
  source: 'discord' | 'in_app' | 'email' | 'support';
  channel: string; // e.g., "#bug-reports", "#feature-requests"
  user_id: string;
  user_name: string;
  user_role?: string; // e.g., "power_user", "beta_tester"
  message: string;
  timestamp: string;
  url?: string; // Link to original message
  
  // AI Analysis Results
  analysis?: FeedbackAnalysis;
  
  // Metadata
  attachments?: string[]; // Screenshot URLs
  thread_id?: string; // If part of a conversation
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface FeedbackAnalysis {
  category: 'bug' | 'feature_request' | 'ux_issue' | 'praise' | 'question' | 'complaint' | 'other';
  subcategory?: string; // e.g., "performance", "ui", "data_sync"
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number; // -1 (very negative) to +1 (very positive)
  urgency: 'critical' | 'high' | 'medium' | 'low';
  urgency_score: number; // 0-100
  
  // Entity Extraction
  features_mentioned: string[]; // ["Goals", "Energy System", "Automation"]
  pain_points: string[]; // Extracted specific issues
  
  // Intent & Impact
  user_intent: string; // What the user is trying to accomplish
  estimated_impact: 'high' | 'medium' | 'low'; // How many users affected
  
  // Technical
  technical_details?: {
    error_mentioned: boolean;
    steps_to_reproduce: boolean;
    environment?: string; // "mobile", "desktop", "browser"
  };
  
  // AI Summary
  summary: string; // One-sentence summary
  suggested_action?: string; // What should be done
  
  // Confidence
  confidence: number; // 0-1, how confident the AI is
}

export interface FeedbackCluster {
  id: string;
  title: string; // AI-generated title for the cluster
  description: string; // Summary of all feedback in this cluster
  category: FeedbackAnalysis['category'];
  subcategory?: string;
  
  // Items
  feedback_ids: string[]; // All feedback items in this cluster
  count: number; // Number of items
  
  // Scoring
  priority_score: number; // 0-100, calculated from multiple factors
  impact_score: number; // 0-100, estimated users affected
  urgency_score: number; // 0-100, average urgency
  frequency_score: number; // 0-100, how often mentioned
  recency_score: number; // 0-100, how recent the feedback is
  
  // Trends
  first_seen: string;
  last_seen: string;
  trend: 'rising' | 'stable' | 'declining'; // Is this getting more mentions?
  
  // Status
  status: 'new' | 'investigating' | 'planned' | 'in_progress' | 'resolved' | 'wont_fix';
  assigned_to?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsights {
  period: {
    start: string;
    end: string;
  };
  
  // Summary Stats
  total_feedback: number;
  by_category: Record<string, number>;
  by_sentiment: Record<string, number>;
  by_urgency: Record<string, number>;
  
  // Top Issues
  top_clusters: FeedbackCluster[];
  critical_issues: FeedbackCluster[];
  trending_up: FeedbackCluster[];
  trending_down: FeedbackCluster[];
  
  // User Insights
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    feedback_count: number;
    avg_sentiment: number;
  }>;
  
  // Feature Mentions
  top_features_mentioned: Array<{
    feature: string;
    count: number;
    sentiment: number; // avg sentiment when this feature is mentioned
  }>;
  
  // Recommendations
  recommended_actions: Array<{
    priority: number;
    action: string;
    reason: string;
    cluster_id?: string;
  }>;
}

// =====================================================================
// AI ANALYSIS ENGINE
// Uses OpenRouter for advanced NLP analysis
// =====================================================================

export async function analyzeFeedback(feedback: FeedbackItem): Promise<FeedbackAnalysis> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!apiKey) {
    console.warn('[Feedback AI] OpenRouter API key not found, using basic analysis');
    return basicAnalysis(feedback);
  }
  
  try {
    const prompt = `You are an expert product analyst analyzing user feedback for a productivity app called SyncScript. 

The app has these key features:
- Goal & Task Management with AI automation
- Energy & Focus tracking (Points Mode and Aura Mode)
- Scripts & Templates marketplace
- Adaptive Resonance Architecture (ARA) for personalization
- Multi-page dashboard with visualizations

Analyze this user feedback and extract structured insights:

FEEDBACK:
Channel: ${feedback.channel}
User: ${feedback.user_name} (${feedback.user_role || 'beta_tester'})
Message: "${feedback.message}"

Provide your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "category": "bug|feature_request|ux_issue|praise|question|complaint|other",
  "subcategory": "performance|ui|data_sync|mobile|automation|energy_system|goals|templates|other",
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": <number from -1 to 1>,
  "urgency": "critical|high|medium|low",
  "urgency_score": <number from 0 to 100>,
  "features_mentioned": ["feature1", "feature2"],
  "pain_points": ["specific issue 1", "specific issue 2"],
  "user_intent": "what the user is trying to accomplish",
  "estimated_impact": "high|medium|low",
  "technical_details": {
    "error_mentioned": true|false,
    "steps_to_reproduce": true|false,
    "environment": "mobile|desktop|browser|unknown"
  },
  "summary": "one-sentence summary of the feedback",
  "suggested_action": "specific action to take",
  "confidence": <number from 0 to 1>
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://syncscript.app',
        'X-Title': 'SyncScript Feedback Intelligence'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(jsonStr) as FeedbackAnalysis;
    
    console.log(`[Feedback AI] Analyzed feedback ${feedback.id} - Category: ${analysis.category}, Urgency: ${analysis.urgency}`);
    
    return analysis;
    
  } catch (error) {
    console.error('[Feedback AI] Analysis failed, using fallback:', error);
    return basicAnalysis(feedback);
  }
}

// Basic analysis fallback (keyword-based)
function basicAnalysis(feedback: FeedbackItem): FeedbackAnalysis {
  const message = feedback.message.toLowerCase();
  
  // Category detection
  let category: FeedbackAnalysis['category'] = 'other';
  if (feedback.channel.includes('bug') || message.includes('bug') || message.includes('error') || message.includes('broken')) {
    category = 'bug';
  } else if (feedback.channel.includes('feature') || message.includes('would love') || message.includes('could you add') || message.includes('suggestion')) {
    category = 'feature_request';
  } else if (message.includes('confusing') || message.includes('hard to') || message.includes('ux') || message.includes('ui')) {
    category = 'ux_issue';
  } else if (message.includes('love') || message.includes('amazing') || message.includes('great') || message.includes('awesome')) {
    category = 'praise';
  } else if (message.includes('how') || message.includes('?')) {
    category = 'question';
  }
  
  // Sentiment detection
  const positiveWords = ['love', 'great', 'awesome', 'amazing', 'perfect', 'excellent', 'works well'];
  const negativeWords = ['bug', 'broken', 'issue', 'problem', 'error', 'crash', 'slow', 'confusing', 'frustrating'];
  
  let sentiment: FeedbackAnalysis['sentiment'] = 'neutral';
  let sentimentScore = 0;
  
  const positiveCount = positiveWords.filter(w => message.includes(w)).length;
  const negativeCount = negativeWords.filter(w => message.includes(w)).length;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = 0.5;
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = -0.5;
  } else if (positiveCount > 0 && negativeCount > 0) {
    sentiment = 'mixed';
  }
  
  // Urgency detection
  let urgency: FeedbackAnalysis['urgency'] = 'medium';
  let urgencyScore = 50;
  
  if (message.includes('critical') || message.includes('urgent') || message.includes('asap') || message.includes('can\'t use')) {
    urgency = 'critical';
    urgencyScore = 95;
  } else if (message.includes('important') || message.includes('need') || category === 'bug') {
    urgency = 'high';
    urgencyScore = 75;
  } else if (category === 'praise' || category === 'question') {
    urgency = 'low';
    urgencyScore = 25;
  }
  
  // Feature extraction
  const features = [];
  if (message.includes('goal')) features.push('Goals');
  if (message.includes('task')) features.push('Tasks');
  if (message.includes('energy') || message.includes('focus')) features.push('Energy System');
  if (message.includes('automation') || message.includes('script')) features.push('Automation');
  if (message.includes('template')) features.push('Templates');
  
  return {
    category,
    sentiment,
    sentiment_score: sentimentScore,
    urgency,
    urgency_score: urgencyScore,
    features_mentioned: features,
    pain_points: [],
    user_intent: 'Unknown - basic analysis',
    estimated_impact: urgency === 'critical' ? 'high' : urgency === 'high' ? 'medium' : 'low',
    technical_details: {
      error_mentioned: message.includes('error'),
      steps_to_reproduce: false,
      environment: 'unknown'
    },
    summary: feedback.message.slice(0, 100) + (feedback.message.length > 100 ? '...' : ''),
    suggested_action: category === 'bug' ? 'Investigate and fix' : category === 'feature_request' ? 'Add to roadmap' : 'Review',
    confidence: 0.6
  };
}

// =====================================================================
// CLUSTERING ENGINE
// Groups similar feedback using semantic similarity
// =====================================================================

export async function clusterFeedback(feedbackItems: FeedbackItem[]): Promise<FeedbackCluster[]> {
  const clusters: FeedbackCluster[] = [];
  
  // Group by category first
  const byCategory: Record<string, FeedbackItem[]> = {};
  
  for (const item of feedbackItems) {
    if (!item.analysis) continue;
    
    const key = `${item.analysis.category}:${item.analysis.subcategory || 'general'}`;
    if (!byCategory[key]) {
      byCategory[key] = [];
    }
    byCategory[key].push(item);
  }
  
  // For each category group, find semantic clusters
  for (const [key, items] of Object.entries(byCategory)) {
    const [category, subcategory] = key.split(':');
    
    // Simple clustering: group by similar keywords/features
    const subclusters = await groupBySimilarity(items);
    
    for (const subcluster of subclusters) {
      const cluster = createCluster(subcluster, category as any, subcategory);
      clusters.push(cluster);
    }
  }
  
  // Sort by priority score
  clusters.sort((a, b) => b.priority_score - a.priority_score);
  
  return clusters;
}

async function groupBySimilarity(items: FeedbackItem[]): Promise<FeedbackItem[][]> {
  const groups: FeedbackItem[][] = [];
  const used = new Set<string>();
  
  for (const item of items) {
    if (used.has(item.id)) continue;
    
    const group = [item];
    used.add(item.id);
    
    // Find similar items
    for (const other of items) {
      if (used.has(other.id)) continue;
      
      if (areSimilar(item, other)) {
        group.push(other);
        used.add(other.id);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

function areSimilar(a: FeedbackItem, b: FeedbackItem): boolean {
  if (!a.analysis || !b.analysis) return false;
  
  // Same category and subcategory
  if (a.analysis.category !== b.analysis.category) return false;
  if (a.analysis.subcategory !== b.analysis.subcategory) return false;
  
  // Check for common features mentioned
  const aFeatures = new Set(a.analysis.features_mentioned);
  const bFeatures = new Set(b.analysis.features_mentioned);
  
  const intersection = [...aFeatures].filter(f => bFeatures.has(f));
  
  // If they mention the same features, consider them similar
  if (intersection.length > 0) return true;
  
  // Check for similar pain points
  const aPains = new Set(a.analysis.pain_points);
  const bPains = new Set(b.analysis.pain_points);
  
  const painIntersection = [...aPains].filter(p => bPains.has(p));
  
  if (painIntersection.length > 0) return true;
  
  // Check for keyword similarity in messages
  const aWords = new Set(a.message.toLowerCase().split(/\s+/));
  const bWords = new Set(b.message.toLowerCase().split(/\s+/));
  
  const commonWords = [...aWords].filter(w => bWords.has(w) && w.length > 4);
  
  // If they share 30%+ of significant words, consider similar
  const similarity = commonWords.length / Math.min(aWords.size, bWords.size);
  
  return similarity > 0.3;
}

function createCluster(items: FeedbackItem[], category: string, subcategory: string): FeedbackCluster {
  const now = new Date();
  
  // Calculate scores
  const urgencyScores = items.map(i => i.analysis?.urgency_score || 50);
  const avgUrgency = urgencyScores.reduce((a, b) => a + b, 0) / urgencyScores.length;
  
  const sentimentScores = items.map(i => i.analysis?.sentiment_score || 0);
  const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  
  // Frequency score (more mentions = higher score)
  const frequencyScore = Math.min(100, items.length * 10);
  
  // Recency score (newer feedback scores higher)
  const timestamps = items.map(i => new Date(i.timestamp).getTime());
  const latestTimestamp = Math.max(...timestamps);
  const oldestTimestamp = Math.min(...timestamps);
  const hoursSinceLatest = (now.getTime() - latestTimestamp) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 100 - (hoursSinceLatest / 24) * 20); // Decay 20 points per day
  
  // Impact score (combination of frequency and urgency)
  const impactScore = (frequencyScore * 0.4) + (avgUrgency * 0.6);
  
  // Priority score (weighted combination of all factors)
  const priorityScore = 
    (frequencyScore * 0.25) +
    (avgUrgency * 0.35) +
    (recencyScore * 0.20) +
    (impactScore * 0.20);
  
  // Determine trend
  const recentItems = items.filter(i => {
    const age = (now.getTime() - new Date(i.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return age <= 3; // Last 3 days
  });
  
  const olderItems = items.filter(i => {
    const age = (now.getTime() - new Date(i.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return age > 3 && age <= 7; // 3-7 days ago
  });
  
  let trend: 'rising' | 'stable' | 'declining' = 'stable';
  if (recentItems.length > olderItems.length * 1.5) {
    trend = 'rising';
  } else if (recentItems.length < olderItems.length * 0.5) {
    trend = 'declining';
  }
  
  // Generate AI title and description
  const features = new Set<string>();
  const painPoints = new Set<string>();
  
  for (const item of items) {
    if (item.analysis) {
      item.analysis.features_mentioned.forEach(f => features.add(f));
      item.analysis.pain_points.forEach(p => painPoints.add(p));
    }
  }
  
  const title = generateClusterTitle(category, subcategory, Array.from(features), items);
  const description = generateClusterDescription(items, Array.from(painPoints));
  
  return {
    id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    category: category as any,
    subcategory: subcategory === 'general' ? undefined : subcategory,
    feedback_ids: items.map(i => i.id),
    count: items.length,
    priority_score: Math.round(priorityScore),
    impact_score: Math.round(impactScore),
    urgency_score: Math.round(avgUrgency),
    frequency_score: Math.round(frequencyScore),
    recency_score: Math.round(recencyScore),
    first_seen: new Date(oldestTimestamp).toISOString(),
    last_seen: new Date(latestTimestamp).toISOString(),
    trend,
    status: 'new',
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };
}

function generateClusterTitle(category: string, subcategory: string, features: string[], items: FeedbackItem[]): string {
  if (category === 'bug') {
    if (subcategory === 'performance') return `Performance Issues ${features.length > 0 ? `with ${features[0]}` : ''}`;
    if (subcategory === 'ui') return `UI Bug ${features.length > 0 ? `in ${features[0]}` : ''}`;
    if (subcategory === 'data_sync') return 'Data Sync Issues';
    return `${subcategory || 'General'} Bug`;
  }
  
  if (category === 'feature_request') {
    if (features.length > 0) return `Request: Improve ${features[0]}`;
    return `${subcategory || 'Feature'} Request`;
  }
  
  if (category === 'ux_issue') {
    if (features.length > 0) return `UX Issue: ${features[0]} Confusing`;
    return `${subcategory || 'General'} UX Issue`;
  }
  
  if (category === 'praise') {
    if (features.length > 0) return `Users Love ${features[0]}`;
    return 'Positive Feedback';
  }
  
  return `${category} (${items.length} reports)`;
}

function generateClusterDescription(items: FeedbackItem[], painPoints: string[]): string {
  const count = items.length;
  const userNames = items.slice(0, 3).map(i => i.user_name).join(', ');
  
  let desc = `${count} user${count > 1 ? 's' : ''} reported this issue`;
  
  if (count <= 3) {
    desc += ` (${userNames})`;
  } else {
    desc += ` including ${userNames}, and ${count - 3} others`;
  }
  
  if (painPoints.length > 0) {
    desc += `. Key issues: ${painPoints.slice(0, 2).join(', ')}`;
  }
  
  return desc;
}

// =====================================================================
// INSIGHTS GENERATOR
// Creates actionable insights from clustered feedback
// =====================================================================

export async function generateInsights(
  startDate: string,
  endDate: string
): Promise<FeedbackInsights> {
  // Fetch all feedback in the date range
  const allFeedback = await getFeedbackInRange(startDate, endDate);
  
  // Run clustering
  const clusters = await clusterFeedback(allFeedback);
  
  // Calculate summary stats
  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  const byUrgency: Record<string, number> = {};
  
  for (const item of allFeedback) {
    if (!item.analysis) continue;
    
    byCategory[item.analysis.category] = (byCategory[item.analysis.category] || 0) + 1;
    bySentiment[item.analysis.sentiment] = (bySentiment[item.analysis.sentiment] || 0) + 1;
    byUrgency[item.analysis.urgency] = (byUrgency[item.analysis.urgency] || 0) + 1;
  }
  
  // Get top clusters
  const topClusters = clusters.slice(0, 10);
  const criticalIssues = clusters.filter(c => c.urgency_score >= 80);
  const trendingUp = clusters.filter(c => c.trend === 'rising').slice(0, 5);
  const trendingDown = clusters.filter(c => c.trend === 'declining').slice(0, 5);
  
  // Most active users
  const userActivity: Record<string, { name: string; count: number; sentiments: number[] }> = {};
  
  for (const item of allFeedback) {
    if (!userActivity[item.user_id]) {
      userActivity[item.user_id] = { name: item.user_name, count: 0, sentiments: [] };
    }
    userActivity[item.user_id].count++;
    if (item.analysis) {
      userActivity[item.user_id].sentiments.push(item.analysis.sentiment_score);
    }
  }
  
  const mostActiveUsers = Object.entries(userActivity)
    .map(([userId, data]) => ({
      user_id: userId,
      user_name: data.name,
      feedback_count: data.count,
      avg_sentiment: data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
    }))
    .sort((a, b) => b.feedback_count - a.feedback_count)
    .slice(0, 10);
  
  // Top features mentioned
  const featureMentions: Record<string, { count: number; sentiments: number[] }> = {};
  
  for (const item of allFeedback) {
    if (!item.analysis) continue;
    
    for (const feature of item.analysis.features_mentioned) {
      if (!featureMentions[feature]) {
        featureMentions[feature] = { count: 0, sentiments: [] };
      }
      featureMentions[feature].count++;
      featureMentions[feature].sentiments.push(item.analysis.sentiment_score);
    }
  }
  
  const topFeaturesMentioned = Object.entries(featureMentions)
    .map(([feature, data]) => ({
      feature,
      count: data.count,
      sentiment: data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Generate recommended actions
  const recommendedActions: FeedbackInsights['recommended_actions'] = [];
  
  // Critical issues first
  for (const cluster of criticalIssues.slice(0, 3)) {
    recommendedActions.push({
      priority: 100,
      action: `URGENT: Address "${cluster.title}"`,
      reason: `${cluster.count} users reported critical issue with urgency score ${cluster.urgency_score}`,
      cluster_id: cluster.id
    });
  }
  
  // High-impact trending issues
  for (const cluster of trendingUp.slice(0, 3)) {
    if (cluster.priority_score >= 70) {
      recommendedActions.push({
        priority: cluster.priority_score,
        action: `Investigate trending issue: "${cluster.title}"`,
        reason: `Rising trend with ${cluster.count} reports in last 3 days`,
        cluster_id: cluster.id
      });
    }
  }
  
  // Feature requests with high frequency
  const featureRequests = clusters.filter(c => c.category === 'feature_request' && c.count >= 3);
  for (const cluster of featureRequests.slice(0, 2)) {
    recommendedActions.push({
      priority: cluster.priority_score,
      action: `Consider implementing: "${cluster.title}"`,
      reason: `${cluster.count} users requested this feature`,
      cluster_id: cluster.id
    });
  }
  
  // Sort by priority
  recommendedActions.sort((a, b) => b.priority - a.priority);
  
  return {
    period: {
      start: startDate,
      end: endDate
    },
    total_feedback: allFeedback.length,
    by_category: byCategory,
    by_sentiment: bySentiment,
    by_urgency: byUrgency,
    top_clusters: topClusters,
    critical_issues: criticalIssues,
    trending_up: trendingUp,
    trending_down: trendingDown,
    most_active_users: mostActiveUsers,
    top_features_mentioned: topFeaturesMentioned,
    recommended_actions: recommendedActions
  };
}

// =====================================================================
// STORAGE FUNCTIONS
// =====================================================================

export async function saveFeedback(feedback: FeedbackItem): Promise<void> {
  const key = `feedback:${feedback.id}`;
  await kv.set(key, feedback);
  
  // Also index by date for efficient querying
  const date = feedback.timestamp.split('T')[0];
  const dateKey = `feedback_by_date:${date}`;
  
  const existing = await kv.get(dateKey) || [];
  const existingIds = Array.isArray(existing) ? existing : [];
  
  if (!existingIds.includes(feedback.id)) {
    existingIds.push(feedback.id);
    await kv.set(dateKey, existingIds);
  }
  
  console.log(`[Feedback Storage] Saved feedback ${feedback.id}`);
}

export async function getFeedback(id: string): Promise<FeedbackItem | null> {
  const key = `feedback:${id}`;
  const feedback = await kv.get(key);
  return feedback as FeedbackItem | null;
}

export async function getFeedbackInRange(startDate: string, endDate: string): Promise<FeedbackItem[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allFeedback: FeedbackItem[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().split('T')[0];
    const dateKey = `feedback_by_date:${date}`;
    
    const ids = await kv.get(dateKey) || [];
    const feedbackIds = Array.isArray(ids) ? ids : [];
    
    for (const id of feedbackIds) {
      const feedback = await getFeedback(id as string);
      if (feedback) {
        allFeedback.push(feedback);
      }
    }
  }
  
  return allFeedback;
}

export async function saveCluster(cluster: FeedbackCluster): Promise<void> {
  const key = `cluster:${cluster.id}`;
  await kv.set(key, cluster);
  
  console.log(`[Feedback Storage] Saved cluster ${cluster.id}`);
}

export async function getCluster(id: string): Promise<FeedbackCluster | null> {
  const key = `cluster:${id}`;
  const cluster = await kv.get(key);
  return cluster as FeedbackCluster | null;
}

export async function getAllClusters(): Promise<FeedbackCluster[]> {
  const results = await kv.getByPrefix('cluster:');
  return results as FeedbackCluster[];
}

export async function updateClusterStatus(
  clusterId: string,
  status: FeedbackCluster['status'],
  assignedTo?: string
): Promise<void> {
  const cluster = await getCluster(clusterId);
  if (!cluster) {
    throw new Error(`Cluster ${clusterId} not found`);
  }
  
  cluster.status = status;
  cluster.updated_at = new Date().toISOString();
  
  if (assignedTo) {
    cluster.assigned_to = assignedTo;
  }
  
  await saveCluster(cluster);
  
  console.log(`[Feedback Storage] Updated cluster ${clusterId} status to ${status}`);
}
