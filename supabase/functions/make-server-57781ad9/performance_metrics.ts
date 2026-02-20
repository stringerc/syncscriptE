/**
 * Performance Metrics Backend
 * Calculate and track CSAT, NPS, CES, response times, quality scores
 */

import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

interface PerformanceMetrics {
  csat: {
    score: number;
    responses: number;
    trend: 'up' | 'down' | 'stable';
    breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  nps: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: 'up' | 'down' | 'stable';
  };
  ces: {
    score: number;
    responses: number;
    trend: 'up' | 'down' | 'stable';
  };
  responseTime: {
    average: number;
    median: number;
    p90: number;
    p95: number;
    firstResponseGoal: number;
    goalAchievementRate: number;
  };
  resolutionTime: {
    average: number;
    median: number;
    p90: number;
    resolutionGoal: number;
    goalAchievementRate: number;
  };
  qualityScore: {
    overall: number;
    empathy: number;
    completeness: number;
    clarity: number;
    accuracy: number;
  };
  volume: {
    total: number;
    pending: number;
    resolved: number;
    avgPerDay: number;
  };
  team: {
    totalAgents: number;
    avgEmailsPerAgent: number;
    topPerformer: {
      name: string;
      emailsHandled: number;
      avgQuality: number;
      avgCSAT: number;
    };
  };
  lastUpdated: string;
}

/**
 * Get current performance metrics
 */
export async function getPerformanceMetrics(c: Context) {
  try {
    // Try to get cached metrics first
    let metrics = await kv.get<PerformanceMetrics>('performance_metrics:current');
    
    if (!metrics) {
      // Calculate if not cached
      metrics = await calculatePerformanceMetrics();
      await kv.set('performance_metrics:current', metrics);
    }
    
    // Recalculate if older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (new Date(metrics.lastUpdated).getTime() < oneHourAgo) {
      metrics = await calculatePerformanceMetrics();
      await kv.set('performance_metrics:current', metrics);
    }
    
    return c.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('[Performance Metrics] Error fetching metrics:', error);
    return c.json({ error: 'Failed to fetch performance metrics', details: error.message }, 500);
  }
}

/**
 * Record customer satisfaction rating (CSAT)
 */
export async function recordCSAT(c: Context) {
  try {
    const { emailId, rating, customerEmail } = await c.req.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }
    
    const csatRecord = {
      id: `csat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emailId,
      customerEmail,
      rating,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`csat:${csatRecord.id}`, csatRecord);
    
    // Trigger metrics recalculation
    await calculatePerformanceMetrics();
    
    return c.json({
      success: true,
      csatRecord
    });
  } catch (error: any) {
    console.error('[Performance Metrics] Error recording CSAT:', error);
    return c.json({ error: 'Failed to record CSAT', details: error.message }, 500);
  }
}

/**
 * Record NPS score
 */
export async function recordNPS(c: Context) {
  try {
    const { score, customerEmail, comment } = await c.req.json();
    
    if (score < 0 || score > 10) {
      return c.json({ error: 'NPS score must be between 0 and 10' }, 400);
    }
    
    const npsRecord = {
      id: `nps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerEmail,
      score,
      comment: comment || '',
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`nps:${npsRecord.id}`, npsRecord);
    
    // Trigger metrics recalculation
    await calculatePerformanceMetrics();
    
    return c.json({
      success: true,
      npsRecord
    });
  } catch (error: any) {
    console.error('[Performance Metrics] Error recording NPS:', error);
    return c.json({ error: 'Failed to record NPS', details: error.message }, 500);
  }
}

/**
 * Record CES (Customer Effort Score)
 */
export async function recordCES(c: Context) {
  try {
    const { emailId, score, customerEmail } = await c.req.json();
    
    if (score < 1 || score > 7) {
      return c.json({ error: 'CES score must be between 1 and 7' }, 400);
    }
    
    const cesRecord = {
      id: `ces_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emailId,
      customerEmail,
      score,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`ces:${cesRecord.id}`, cesRecord);
    
    // Trigger metrics recalculation
    await calculatePerformanceMetrics();
    
    return c.json({
      success: true,
      cesRecord
    });
  } catch (error: any) {
    console.error('[Performance Metrics] Error recording CES:', error);
    return c.json({ error: 'Failed to record CES', details: error.message }, 500);
  }
}

/**
 * Calculate all performance metrics
 */
async function calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
  // Get all relevant data
  const [csatRecords, npsRecords, cesRecords, emails] = await Promise.all([
    kv.getByPrefix('csat:'),
    kv.getByPrefix('nps:'),
    kv.getByPrefix('ces:'),
    kv.getByPrefix('email:')
  ]);
  
  // Calculate CSAT
  const csatRatings = csatRecords.map(r => r.value.rating);
  const csat = calculateCSAT(csatRatings);
  
  // Calculate NPS
  const npsScores = npsRecords.map(r => r.value.score);
  const nps = calculateNPS(npsScores);
  
  // Calculate CES
  const cesScores = cesRecords.map(r => r.value.score);
  const ces = calculateCES(cesScores);
  
  // Calculate response times
  const emailsWithResponse = emails
    .map(e => e.value)
    .filter(e => e.status === 'sent' && e.responseTime);
  
  const responseTimes = emailsWithResponse.map(e => e.responseTime);
  const responseTime = calculateTimingMetrics(responseTimes, 10); // 10 min goal
  
  // Calculate resolution times (mock for now - would track time to resolution)
  const resolutionTimes = emailsWithResponse.map(e => (e.responseTime || 0) * 3); // Estimate
  const resolutionTime = calculateTimingMetrics(resolutionTimes, 24 * 60); // 24 hour goal
  
  // Calculate quality scores (would use actual analysis data)
  const qualityScore = {
    overall: 87,
    empathy: 89,
    completeness: 85,
    clarity: 88,
    accuracy: 86
  };
  
  // Calculate volume metrics
  const allEmails = emails.map(e => e.value);
  const volume = {
    total: allEmails.length,
    pending: allEmails.filter(e => e.status === 'pending').length,
    resolved: allEmails.filter(e => e.status === 'sent').length,
    avgPerDay: allEmails.length / 14 // Assume 14 day window
  };
  
  // Team metrics (simplified - in production would track per agent)
  const team = {
    totalAgents: 1,
    avgEmailsPerAgent: volume.total,
    topPerformer: {
      name: 'You',
      emailsHandled: volume.total,
      avgQuality: qualityScore.overall,
      avgCSAT: csat.score
    }
  };
  
  const metrics: PerformanceMetrics = {
    csat,
    nps,
    ces,
    responseTime,
    resolutionTime,
    qualityScore,
    volume,
    team,
    lastUpdated: new Date().toISOString()
  };
  
  return metrics;
}

/**
 * Calculate CSAT score
 */
function calculateCSAT(ratings: number[]) {
  if (ratings.length === 0) {
    return {
      score: 0,
      responses: 0,
      trend: 'stable' as const,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      breakdown[rating as keyof typeof breakdown]++;
    }
  });
  
  const satisfied = breakdown[4] + breakdown[5];
  const score = Math.round((satisfied / ratings.length) * 100);
  
  // Calculate trend
  const recent = ratings.slice(-10);
  const previous = ratings.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > previousAvg + 0.3) trend = 'up';
  if (recentAvg < previousAvg - 0.3) trend = 'down';
  
  return { score, responses: ratings.length, trend, breakdown };
}

/**
 * Calculate NPS score
 */
function calculateNPS(scores: number[]) {
  if (scores.length === 0) {
    return { score: 0, promoters: 0, passives: 0, detractors: 0, trend: 'stable' as const };
  }
  
  const promoters = scores.filter(s => s >= 9).length;
  const passives = scores.filter(s => s >= 7 && s < 9).length;
  const detractors = scores.filter(s => s < 7).length;
  
  const score = Math.round(((promoters - detractors) / scores.length) * 100);
  
  // Trend
  const recent = scores.slice(-10);
  const previous = scores.slice(-20, -10);
  const recentScore = recent.length > 0 ? 
    ((recent.filter(s => s >= 9).length - recent.filter(s => s < 7).length) / recent.length) * 100 : 0;
  const previousScore = previous.length > 0 ?
    ((previous.filter(s => s >= 9).length - previous.filter(s => s < 7).length) / previous.length) * 100 : recentScore;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentScore > previousScore + 10) trend = 'up';
  if (recentScore < previousScore - 10) trend = 'down';
  
  return { score, promoters, passives, detractors, trend };
}

/**
 * Calculate CES score
 */
function calculateCES(scores: number[]) {
  if (scores.length === 0) {
    return { score: 0, responses: 0, trend: 'stable' as const };
  }
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Trend (for CES, down is good!)
  const recent = scores.slice(-10);
  const previous = scores.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > previousAvg + 0.5) trend = 'up';
  if (recentAvg < previousAvg - 0.5) trend = 'down';
  
  return {
    score: parseFloat(avgScore.toFixed(2)),
    responses: scores.length,
    trend
  };
}

/**
 * Calculate timing metrics (response time, resolution time)
 */
function calculateTimingMetrics(times: number[], goal: number) {
  if (times.length === 0) {
    return {
      average: 0,
      median: 0,
      p90: 0,
      p95: 0,
      firstResponseGoal: goal,
      goalAchievementRate: 0
    };
  }
  
  times.sort((a, b) => a - b);
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const p95 = times[Math.floor(times.length * 0.95)];
  
  const withinGoal = times.filter(t => t <= goal).length;
  const goalAchievementRate = (withinGoal / times.length) * 100;
  
  return {
    average: parseFloat(average.toFixed(1)),
    median: parseFloat(median.toFixed(1)),
    p90: parseFloat(p90.toFixed(1)),
    p95: parseFloat(p95.toFixed(1)),
    firstResponseGoal: goal,
    goalAchievementRate: parseFloat(goalAchievementRate.toFixed(1))
  };
}

/**
 * Force recalculation of metrics (admin endpoint)
 */
export async function recalculateMetrics(c: Context) {
  try {
    const metrics = await calculatePerformanceMetrics();
    await kv.set('performance_metrics:current', metrics);
    
    return c.json({
      success: true,
      metrics,
      message: 'Metrics recalculated successfully'
    });
  } catch (error: any) {
    console.error('[Performance Metrics] Error recalculating:', error);
    return c.json({ error: 'Failed to recalculate metrics', details: error.message }, 500);
  }
}
