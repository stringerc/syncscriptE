// =====================================================================
// FEEDBACK INTELLIGENCE API ROUTES
// Complete feedback analysis and insights endpoints
// =====================================================================

import { Hono } from 'npm:hono';
import {
  FeedbackItem,
  FeedbackCluster,
  analyzeFeedback,
  clusterFeedback,
  generateInsights,
  saveFeedback,
  getFeedback,
  getFeedbackInRange,
  saveCluster,
  getCluster,
  getAllClusters,
  updateClusterStatus
} from './feedback-intelligence.tsx';
import { generateAndSendDailyDigest, sendDailyDigest } from './feedback-digest.tsx';
import { sendTestEmail } from './test-email.tsx';
import * as kv from './kv_store.tsx';

const app = new Hono();

// =====================================================================
// DISCORD WEBHOOK INTEGRATION
// Receives messages from Discord and processes them
// =====================================================================

app.post('/discord-webhook', async (c) => {
  try {
    const payload = await c.req.json();
    
    // Discord webhook payload structure
    const {
      content, // Message content
      author, // { id, username, discriminator }
      channel_id,
      channel_name,
      timestamp,
      attachments, // Array of attachment URLs
      message_id,
      guild_id
    } = payload;
    
    if (!content || !author) {
      return c.json({ error: 'Invalid webhook payload' }, 400);
    }
    
    // Ignore bot messages
    if (author.bot) {
      return c.json({ success: true, message: 'Ignored bot message' });
    }
    
    // Create feedback item
    const feedback: FeedbackItem = {
      id: `discord_${message_id || Date.now()}`,
      source: 'discord',
      channel: channel_name || `#${channel_id}`,
      user_id: author.id,
      user_name: author.username,
      message: content,
      timestamp: timestamp || new Date().toISOString(),
      url: `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`,
      attachments: attachments?.map((a: any) => a.url) || []
    };
    
    // Analyze with AI
    console.log(`[Feedback API] Processing Discord message from ${author.username} in ${channel_name}`);
    const analysis = await analyzeFeedback(feedback);
    feedback.analysis = analysis;
    
    // Save to database
    await saveFeedback(feedback);
    
    console.log(`[Feedback API] Saved and analyzed feedback: ${feedback.id} - Category: ${analysis.category}, Urgency: ${analysis.urgency}`);
    
    return c.json({
      success: true,
      feedback_id: feedback.id,
      analysis: {
        category: analysis.category,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        summary: analysis.summary
      }
    });
    
  } catch (error) {
    console.error('[Feedback API] Error processing Discord webhook:', error);
    return c.json({ error: 'Failed to process webhook', details: String(error) }, 500);
  }
});

// =====================================================================
// MANUAL FEEDBACK SUBMISSION
// For in-app feedback widget
// =====================================================================

app.post('/submit', async (c) => {
  try {
    const {
      user_id,
      user_name,
      message,
      category, // Optional pre-categorization
      attachments
    } = await c.req.json();
    
    if (!user_id || !user_name || !message) {
      return c.json({ error: 'user_id, user_name, and message are required' }, 400);
    }
    
    const feedback: FeedbackItem = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'in_app',
      channel: category || 'general',
      user_id,
      user_name,
      message,
      timestamp: new Date().toISOString(),
      attachments: attachments || []
    };
    
    // Analyze with AI
    console.log(`[Feedback API] Processing in-app feedback from ${user_name}`);
    const analysis = await analyzeFeedback(feedback);
    feedback.analysis = analysis;
    
    // Save to database
    await saveFeedback(feedback);
    
    console.log(`[Feedback API] Saved in-app feedback: ${feedback.id}`);
    
    return c.json({
      success: true,
      feedback_id: feedback.id,
      message: 'Thank you for your feedback!',
      analysis: {
        category: analysis.category,
        sentiment: analysis.sentiment
      }
    });
    
  } catch (error) {
    console.error('[Feedback API] Error submitting feedback:', error);
    return c.json({ error: 'Failed to submit feedback', details: String(error) }, 500);
  }
});

// =====================================================================
// FEEDBACK RETRIEVAL
// =====================================================================

app.get('/feedback/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const feedback = await getFeedback(id);
    
    if (!feedback) {
      return c.json({ error: 'Feedback not found' }, 404);
    }
    
    return c.json({ feedback });
    
  } catch (error) {
    console.error('[Feedback API] Error retrieving feedback:', error);
    return c.json({ error: 'Failed to retrieve feedback', details: String(error) }, 500);
  }
});

app.get('/feedback', async (c) => {
  try {
    const start_date = c.req.query('start_date');
    const end_date = c.req.query('end_date');
    
    if (!start_date || !end_date) {
      return c.json({ error: 'start_date and end_date are required' }, 400);
    }
    
    const feedback = await getFeedbackInRange(start_date, end_date);
    
    // Apply filters
    const category = c.req.query('category');
    const sentiment = c.req.query('sentiment');
    const urgency = c.req.query('urgency');
    const source = c.req.query('source');
    
    let filtered = feedback;
    
    if (category) {
      filtered = filtered.filter(f => f.analysis?.category === category);
    }
    
    if (sentiment) {
      filtered = filtered.filter(f => f.analysis?.sentiment === sentiment);
    }
    
    if (urgency) {
      filtered = filtered.filter(f => f.analysis?.urgency === urgency);
    }
    
    if (source) {
      filtered = filtered.filter(f => f.source === source);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({
      feedback: filtered,
      total: filtered.length,
      period: { start: start_date, end: end_date }
    });
    
  } catch (error) {
    console.error('[Feedback API] Error querying feedback:', error);
    return c.json({ error: 'Failed to query feedback', details: String(error) }, 500);
  }
});

// =====================================================================
// CLUSTERING & ANALYSIS
// =====================================================================

app.post('/analyze', async (c) => {
  try {
    const { start_date, end_date } = await c.req.json();
    
    if (!start_date || !end_date) {
      return c.json({ error: 'start_date and end_date are required' }, 400);
    }
    
    console.log(`[Feedback API] Running analysis for ${start_date} to ${end_date}`);
    
    // Get all feedback in range
    const feedback = await getFeedbackInRange(start_date, end_date);
    
    if (feedback.length === 0) {
      return c.json({
        message: 'No feedback found in this date range',
        clusters: [],
        total_feedback: 0
      });
    }
    
    // Run clustering
    const clusters = await clusterFeedback(feedback);
    
    // Save clusters
    for (const cluster of clusters) {
      await saveCluster(cluster);
    }
    
    console.log(`[Feedback API] Analysis complete: ${feedback.length} feedback items → ${clusters.length} clusters`);
    
    return c.json({
      success: true,
      total_feedback: feedback.length,
      total_clusters: clusters.length,
      clusters: clusters.slice(0, 20), // Return top 20
      message: `Analyzed ${feedback.length} feedback items into ${clusters.length} clusters`
    });
    
  } catch (error) {
    console.error('[Feedback API] Error analyzing feedback:', error);
    return c.json({ error: 'Failed to analyze feedback', details: String(error) }, 500);
  }
});

// =====================================================================
// INSIGHTS GENERATION
// =====================================================================

app.get('/insights', async (c) => {
  try {
    const period = c.req.query('period') || '7d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    console.log(`[Feedback API] Generating insights for ${start} to ${end}`);
    
    const insights = await generateInsights(start, end);
    
    console.log(`[Feedback API] Generated insights: ${insights.total_feedback} feedback, ${insights.top_clusters.length} clusters`);
    
    return c.json({ insights });
    
  } catch (error) {
    console.error('[Feedback API] Error generating insights:', error);
    return c.json({ error: 'Failed to generate insights', details: String(error) }, 500);
  }
});

// =====================================================================
// CLUSTER MANAGEMENT
// =====================================================================

app.get('/clusters', async (c) => {
  try {
    const clusters = await getAllClusters();
    
    // Apply filters
    const status = c.req.query('status');
    const category = c.req.query('category');
    const min_priority = c.req.query('min_priority');
    
    let filtered = clusters;
    
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    if (category) {
      filtered = filtered.filter(c => c.category === category);
    }
    
    if (min_priority) {
      const minPriority = parseInt(min_priority, 10);
      filtered = filtered.filter(c => c.priority_score >= minPriority);
    }
    
    // Sort by priority
    filtered.sort((a, b) => b.priority_score - a.priority_score);
    
    return c.json({
      clusters: filtered,
      total: filtered.length
    });
    
  } catch (error) {
    console.error('[Feedback API] Error retrieving clusters:', error);
    return c.json({ error: 'Failed to retrieve clusters', details: String(error) }, 500);
  }
});

app.get('/clusters/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const cluster = await getCluster(id);
    
    if (!cluster) {
      return c.json({ error: 'Cluster not found' }, 404);
    }
    
    // Get all feedback items in this cluster
    const feedbackItems = [];
    for (const feedbackId of cluster.feedback_ids) {
      const feedback = await getFeedback(feedbackId);
      if (feedback) {
        feedbackItems.push(feedback);
      }
    }
    
    return c.json({
      cluster,
      feedback_items: feedbackItems
    });
    
  } catch (error) {
    console.error('[Feedback API] Error retrieving cluster:', error);
    return c.json({ error: 'Failed to retrieve cluster', details: String(error) }, 500);
  }
});

app.put('/clusters/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, assigned_to } = await c.req.json();
    
    if (!status) {
      return c.json({ error: 'status is required' }, 400);
    }
    
    const validStatuses = ['new', 'investigating', 'planned', 'in_progress', 'resolved', 'wont_fix'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
    }
    
    await updateClusterStatus(id, status, assigned_to);
    
    const updatedCluster = await getCluster(id);
    
    console.log(`[Feedback API] Updated cluster ${id} status to ${status}`);
    
    return c.json({
      success: true,
      cluster: updatedCluster
    });
    
  } catch (error) {
    console.error('[Feedback API] Error updating cluster status:', error);
    return c.json({ error: 'Failed to update cluster status', details: String(error) }, 500);
  }
});

// =====================================================================
// DAILY DIGEST (Can be called by cron job)
// =====================================================================

app.get('/digest/daily', async (c) => {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log(`[Feedback API] Generating daily digest for ${dateStr}`);
    
    const feedback = await getFeedbackInRange(dateStr, dateStr);
    
    if (feedback.length === 0) {
      return c.json({
        message: 'No feedback received yesterday',
        date: dateStr
      });
    }
    
    // Generate insights
    const insights = await generateInsights(dateStr, dateStr);
    
    // Format digest
    const digest = {
      date: dateStr,
      total_feedback: feedback.length,
      
      summary: {
        bugs: insights.by_category['bug'] || 0,
        feature_requests: insights.by_category['feature_request'] || 0,
        ux_issues: insights.by_category['ux_issue'] || 0,
        praise: insights.by_category['praise'] || 0
      },
      
      sentiment: {
        positive: insights.by_sentiment['positive'] || 0,
        negative: insights.by_sentiment['negative'] || 0,
        neutral: insights.by_sentiment['neutral'] || 0
      },
      
      critical_issues: insights.critical_issues.slice(0, 5),
      trending: insights.trending_up.slice(0, 5),
      top_contributors: insights.most_active_users.slice(0, 5),
      recommended_actions: insights.recommended_actions.slice(0, 10)
    };
    
    console.log(`[Feedback API] Daily digest generated: ${feedback.length} items, ${insights.critical_issues.length} critical issues`);
    
    return c.json({ digest });
    
  } catch (error) {
    console.error('[Feedback API] Error generating daily digest:', error);
    return c.json({ error: 'Failed to generate daily digest', details: String(error) }, 500);
  }
});

// =====================================================================
// EMAIL TESTING
// =====================================================================

app.post('/test-email', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'email is required' }, 400);
    }
    
    console.log(`[Feedback API] Sending test email to ${email}`);
    
    const result = await sendTestEmail(email);
    
    if (!result.success) {
      console.error(`[Feedback API] Test email failed:`, result.error);
      return c.json({ error: result.error }, 500);
    }
    
    return c.json({
      success: true,
      message: `Test email sent to ${email}`,
      emailId: result.emailId
    });
    
  } catch (error) {
    console.error('[Feedback API] Error sending test email:', error);
    return c.json({ error: 'Failed to send test email', details: String(error) }, 500);
  }
});

// =====================================================================
// DIGEST CONFIGURATION & MANAGEMENT
// =====================================================================

app.get('/digest/config', async (c) => {
  try {
    const config = await kv.get('feedback_digest_config') || {
      enabled: false,
      recipients: [],
      schedule: '9:00 AM UTC',
      includeWeekends: false
    };
    
    return c.json({ config });
    
  } catch (error) {
    console.error('[Feedback API] Error retrieving digest config:', error);
    return c.json({ error: 'Failed to retrieve config', details: String(error) }, 500);
  }
});

app.put('/digest/config', async (c) => {
  try {
    const config = await c.req.json();
    
    // Validate recipients
    if (config.recipients && Array.isArray(config.recipients)) {
      for (const email of config.recipients) {
        if (!email.includes('@')) {
          return c.json({ error: `Invalid email: ${email}` }, 400);
        }
      }
    }
    
    await kv.set('feedback_digest_config', config);
    
    console.log('[Feedback API] Updated digest configuration');
    
    return c.json({ 
      success: true, 
      message: 'Digest configuration updated',
      config 
    });
    
  } catch (error) {
    console.error('[Feedback API] Error updating digest config:', error);
    return c.json({ error: 'Failed to update config', details: String(error) }, 500);
  }
});

app.post('/digest/send', async (c) => {
  try {
    const { email, date, isTest } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'email is required' }, 400);
    }
    
    console.log(`[Feedback API] Sending digest to ${email}${date ? ` for ${date}` : ''}${isTest ? ' (TEST MODE)' : ''}`);
    
    const result = await generateAndSendDailyDigest(email, date, isTest);
    
    if (!result.success) {
      console.error(`[Feedback API] Digest send failed:`, result.error);
      return c.json({ error: result.error }, 500);
    }
    
    return c.json({
      success: true,
      message: result.digest.total_feedback === 0 
        ? `Test digest sent to ${email} (sample data)` 
        : `Digest sent to ${email} (${result.digest.total_feedback} items)`,
      digest: result.digest
    });
    
  } catch (error) {
    console.error('[Feedback API] Error sending digest:', error);
    return c.json({ error: 'Failed to send digest', details: String(error) }, 500);
  }
});

app.post('/digest/send-all', async (c) => {
  try {
    const config = await kv.get('feedback_digest_config');
    
    if (!config || !config.enabled) {
      return c.json({ error: 'Digest is not enabled' }, 400);
    }
    
    if (!config.recipients || config.recipients.length === 0) {
      return c.json({ error: 'No recipients configured' }, 400);
    }
    
    const { date, isTest } = await c.req.json();
    
    console.log(`[Feedback API] Sending digest to ${config.recipients.length} recipients${isTest ? ' (TEST MODE)' : ''}`);
    
    const results = [];
    
    for (const email of config.recipients) {
      const result = await generateAndSendDailyDigest(email, date, isTest);
      results.push({
        email,
        success: result.success,
        error: result.error,
        digest: result.digest
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[Feedback API] Sent ${successCount}/${config.recipients.length} digests successfully`);
    
    return c.json({
      success: true,
      message: `Sent ${successCount}/${config.recipients.length} digests`,
      results
    });
    
  } catch (error) {
    console.error('[Feedback API] Error sending digests:', error);
    return c.json({ error: 'Failed to send digests', details: String(error) }, 500);
  }
});

// =====================================================================
// EXPORT FUNCTIONALITY
// =====================================================================

app.get('/export', async (c) => {
  try {
    const format = c.req.query('format') || 'json';
    const start_date = c.req.query('start_date');
    const end_date = c.req.query('end_date');
    
    if (!start_date || !end_date) {
      return c.json({ error: 'start_date and end_date are required' }, 400);
    }
    
    const insights = await generateInsights(start_date, end_date);
    
    if (format === 'csv') {
      // CSV export for top clusters
      const headers = [
        'Priority',
        'Title',
        'Category',
        'Count',
        'Urgency',
        'Trend',
        'Status',
        'First Seen',
        'Last Seen'
      ];
      
      const rows = insights.top_clusters.map(c => [
        c.priority_score,
        `"${c.title}"`,
        c.category,
        c.count,
        c.urgency_score,
        c.trend,
        c.status,
        c.first_seen.split('T')[0],
        c.last_seen.split('T')[0]
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="feedback-insights-${start_date}-${end_date}.csv"`
      });
    }
    
    // JSON export (default)
    return c.json({
      insights,
      exported_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Feedback API] Error exporting insights:', error);
    return c.json({ error: 'Failed to export insights', details: String(error) }, 500);
  }
});

export default app;
