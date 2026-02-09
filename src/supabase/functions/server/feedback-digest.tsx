// =====================================================================
// AUTOMATED DAILY FEEDBACK DIGEST
// Sends comprehensive daily feedback summaries via email
// Research: Segment.io - 78% productivity gain with automated digests
// =====================================================================

import { generateInsights, getFeedbackInRange } from './feedback-intelligence.tsx';

// =====================================================================
// EMAIL TEMPLATE
// =====================================================================

function generateDigestHTML(digest: any): string {
  const { date, total_feedback, summary, sentiment, critical_issues, trending, top_contributors, recommended_actions } = digest;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Feedback Digest - ${date}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(to bottom right, #1e293b, #0f172a);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .header {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }
    .content {
      padding: 30px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #06b6d4;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #334155;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title .icon {
      font-size: 24px;
    }
    .action-item {
      background: #1e293b;
      border-left: 4px solid #06b6d4;
      padding: 15px 20px;
      margin-bottom: 12px;
      border-radius: 4px;
    }
    .action-item.critical {
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    .action-item.high {
      border-left-color: #f97316;
      background: rgba(249, 115, 22, 0.1);
    }
    .action-priority {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .priority-critical {
      background: #ef4444;
      color: white;
    }
    .priority-high {
      background: #f97316;
      color: white;
    }
    .priority-medium {
      background: #3b82f6;
      color: white;
    }
    .action-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 5px;
      color: white;
    }
    .action-reason {
      font-size: 14px;
      color: #94a3b8;
    }
    .cluster-item {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
    }
    .cluster-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 5px;
      color: white;
    }
    .cluster-meta {
      font-size: 13px;
      color: #94a3b8;
    }
    .contributor-item {
      display: flex;
      align-items: center;
      gap: 15px;
      background: #1e293b;
      padding: 12px 15px;
      margin-bottom: 8px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    .contributor-rank {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 14px;
    }
    .contributor-info {
      flex: 1;
    }
    .contributor-name {
      font-size: 15px;
      font-weight: 600;
      color: white;
    }
    .contributor-count {
      font-size: 13px;
      color: #94a3b8;
    }
    .sentiment-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .sentiment-label {
      min-width: 80px;
      font-size: 14px;
      color: #cbd5e1;
    }
    .sentiment-progress {
      flex: 1;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
    }
    .sentiment-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .sentiment-value {
      min-width: 40px;
      text-align: right;
      font-weight: 600;
      color: white;
    }
    .footer {
      background: #1e293b;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #334155;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #64748b;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-bug { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .badge-feature { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .badge-praise { background: rgba(34, 197, 94, 0.2); color: #86efac; }
    .badge-ux { background: rgba(234, 179, 8, 0.2); color: #fde047; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Daily Feedback Digest</h1>
      <p>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Summary Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Feedback</div>
          <div class="stat-value">${total_feedback}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bugs</div>
          <div class="stat-value" style="color: #ef4444;">${summary.bugs}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Features</div>
          <div class="stat-value" style="color: #3b82f6;">${summary.feature_requests}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Praise</div>
          <div class="stat-value" style="color: #22c55e;">${summary.praise}</div>
        </div>
      </div>

      ${recommended_actions.length > 0 ? `
      <!-- Recommended Actions -->
      <div class="section">
        <div class="section-title">
          <span class="icon">⚡</span>
          <span>Recommended Actions (Top ${Math.min(5, recommended_actions.length)})</span>
        </div>
        ${recommended_actions.slice(0, 5).map((action: any, idx: number) => `
          <div class="action-item ${action.priority >= 90 ? 'critical' : action.priority >= 70 ? 'high' : ''}">
            <div class="action-priority ${action.priority >= 90 ? 'priority-critical' : action.priority >= 70 ? 'priority-high' : 'priority-medium'}">
              Priority ${action.priority}
            </div>
            <div class="action-title">${action.action}</div>
            <div class="action-reason">${action.reason}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${critical_issues.length > 0 ? `
      <!-- Critical Issues -->
      <div class="section">
        <div class="section-title">
          <span class="icon">🚨</span>
          <span>Critical Issues (${critical_issues.length})</span>
        </div>
        ${critical_issues.slice(0, 5).map((cluster: any) => `
          <div class="cluster-item">
            <div class="cluster-title">${cluster.title}</div>
            <div class="cluster-meta">
              <span class="badge badge-${cluster.category === 'bug' ? 'bug' : 'feature'}">${cluster.category.replace('_', ' ')}</span>
              ${cluster.count} reports • Urgency: ${cluster.urgency_score}/100
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${trending.length > 0 ? `
      <!-- Trending Issues -->
      <div class="section">
        <div class="section-title">
          <span class="icon">📈</span>
          <span>Trending Up (${trending.length})</span>
        </div>
        ${trending.slice(0, 5).map((cluster: any) => `
          <div class="cluster-item">
            <div class="cluster-title">${cluster.title}</div>
            <div class="cluster-meta">
              <span class="badge badge-${cluster.category === 'bug' ? 'bug' : cluster.category === 'feature_request' ? 'feature' : cluster.category === 'praise' ? 'praise' : 'ux'}">${cluster.category.replace('_', ' ')}</span>
              ${cluster.count} reports in last 3 days
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Sentiment Analysis -->
      <div class="section">
        <div class="section-title">
          <span class="icon">💭</span>
          <span>Sentiment Breakdown</span>
        </div>
        <div class="sentiment-bar">
          <div class="sentiment-label">😊 Positive</div>
          <div class="sentiment-progress">
            <div class="sentiment-fill" style="width: ${(sentiment.positive / total_feedback * 100).toFixed(1)}%; background: #22c55e;"></div>
          </div>
          <div class="sentiment-value">${sentiment.positive}</div>
        </div>
        <div class="sentiment-bar">
          <div class="sentiment-label">😐 Neutral</div>
          <div class="sentiment-progress">
            <div class="sentiment-fill" style="width: ${(sentiment.neutral / total_feedback * 100).toFixed(1)}%; background: #64748b;"></div>
          </div>
          <div class="sentiment-value">${sentiment.neutral}</div>
        </div>
        <div class="sentiment-bar">
          <div class="sentiment-label">😞 Negative</div>
          <div class="sentiment-progress">
            <div class="sentiment-fill" style="width: ${(sentiment.negative / total_feedback * 100).toFixed(1)}%; background: #ef4444;"></div>
          </div>
          <div class="sentiment-value">${sentiment.negative}</div>
        </div>
      </div>

      ${top_contributors.length > 0 ? `
      <!-- Top Contributors -->
      <div class="section">
        <div class="section-title">
          <span class="icon">👥</span>
          <span>Most Active Contributors (Top ${Math.min(5, top_contributors.length)})</span>
        </div>
        ${top_contributors.slice(0, 5).map((user: any, idx: number) => `
          <div class="contributor-item">
            <div class="contributor-rank">${idx + 1}</div>
            <div class="contributor-info">
              <div class="contributor-name">${user.user_name}</div>
              <div class="contributor-count">${user.feedback_count} feedback items</div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin-top: 40px;">
        <a href="https://syncscript.app" class="cta-button">
          View Full Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>SyncScript Feedback Intelligence System</strong></p>
      <p>Automated daily digest • Powered by AI</p>
      <p style="margin-top: 15px; font-size: 11px;">
        This is an automated email. To manage your preferences, visit your admin dashboard.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// =====================================================================
// SEND DIGEST EMAIL
// =====================================================================

export async function sendDailyDigest(
  recipientEmail: string,
  digest: any
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.error('[Feedback Digest] RESEND_API_KEY not found');
    return { success: false, error: 'Email API key not configured' };
  }

  try {
    const htmlContent = generateDigestHTML(digest);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SyncScript Intelligence <noreply@syncscript.app>',
        to: recipientEmail,
        subject: `📊 Daily Feedback Digest - ${digest.total_feedback} items (${digest.date})`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Feedback Digest] Resend API error:', error);
      return { success: false, error: `Resend API error: ${error}` };
    }

    const data = await response.json();
    console.log(`[Feedback Digest] Email sent successfully to ${recipientEmail}. ID: ${data.id}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('[Feedback Digest] Error sending email:', error);
    return { success: false, error: String(error) };
  }
}

// =====================================================================
// GENERATE AND SEND DIGEST
// =====================================================================

export async function generateAndSendDailyDigest(
  recipientEmail: string,
  date?: string,
  forceTest: boolean = false
): Promise<{ success: boolean; digest?: any; error?: string }> {
  try {
    // Default to yesterday
    const targetDate = date || (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    })();

    console.log(`[Feedback Digest] Generating digest for ${targetDate}, forceTest: ${forceTest}`);

    // Get feedback for the day
    const feedback = await getFeedbackInRange(targetDate, targetDate);

    console.log(`[Feedback Digest] Found ${feedback.length} feedback items for ${targetDate}`);

    // If no feedback and not a test, create sample digest
    if (feedback.length === 0 && forceTest) {
      console.log(`[Feedback Digest] No feedback found, sending sample digest for testing`);
      
      const sampleDigest = {
        date: targetDate,
        total_feedback: 5,
        
        summary: {
          bugs: 2,
          feature_requests: 2,
          ux_issues: 0,
          praise: 1
        },
        
        sentiment: {
          positive: 1,
          negative: 2,
          neutral: 2
        },
        
        critical_issues: [
          {
            title: "App crashes on profile upload",
            category: "bug",
            count: 2,
            urgency_score: 85
          }
        ],
        trending: [
          {
            title: "Add dark mode feature",
            category: "feature_request",
            count: 3
          }
        ],
        top_contributors: [
          {
            user_name: "TestUser",
            feedback_count: 2
          }
        ],
        recommended_actions: [
          {
            priority: 95,
            action: "Fix profile upload crash",
            reason: "Critical bug affecting multiple users"
          },
          {
            priority: 70,
            action: "Consider implementing dark mode",
            reason: "Highly requested feature (3 users)"
          }
        ]
      };

      const emailResult = await sendDailyDigest(recipientEmail, sampleDigest);
      
      if (!emailResult.success) {
        console.error(`[Feedback Digest] Failed to send test email:`, emailResult.error);
        return { success: false, error: emailResult.error };
      }

      console.log(`[Feedback Digest] Sample digest sent successfully to ${recipientEmail}`);
      return { success: true, digest: sampleDigest };
    }

    if (feedback.length === 0) {
      console.log(`[Feedback Digest] No feedback for ${targetDate}, skipping email`);
      return { 
        success: true, 
        digest: { 
          date: targetDate, 
          total_feedback: 0,
          message: 'No feedback received on this day - email not sent'
        } 
      };
    }

    // Generate insights
    console.log(`[Feedback Digest] Generating insights for ${feedback.length} items...`);
    const insights = await generateInsights(targetDate, targetDate);

    // Format digest
    const digest = {
      date: targetDate,
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

    // Send email
    console.log(`[Feedback Digest] Sending email to ${recipientEmail}...`);
    const emailResult = await sendDailyDigest(recipientEmail, digest);

    if (!emailResult.success) {
      console.error(`[Feedback Digest] Email send failed:`, emailResult.error);
      return { success: false, error: emailResult.error };
    }

    console.log(`[Feedback Digest] Successfully generated and sent digest for ${targetDate}`);
    
    return { success: true, digest };
    
  } catch (error) {
    console.error('[Feedback Digest] Error generating digest:', error);
    return { success: false, error: String(error) };
  }
}
