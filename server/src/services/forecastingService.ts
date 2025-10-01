import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface SpendingForecast {
  forecastDate: Date;
  projectedSpending: number;
  projectedIncome: number;
  projectedSavings: number;
  categoryForecasts: Record<string, {
    projected: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  alerts: string[];
  recommendations: string[];
  confidence: number;
}

export class ForecastingService {
  private static instance: ForecastingService;

  static getInstance(): ForecastingService {
    if (!ForecastingService.instance) {
      ForecastingService.instance = new ForecastingService();
    }
    return ForecastingService.instance;
  }

  /**
   * Generate spending forecast for end of current budget period
   */
  async generateForecast(userId: string, budgetId: string): Promise<SpendingForecast> {
    try {
      logger.info('Generating spending forecast', { userId, budgetId });

      const budget = await prisma.budget.findFirst({
        where: { id: budgetId, userId },
        include: { categories: true }
      });

      if (!budget) {
        throw new Error('Budget not found');
      }

      const now = new Date();
      const forecastDate = budget.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Calculate days elapsed and remaining
      const totalDays = Math.ceil((forecastDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(1, totalDays - daysElapsed);

      // Calculate current spending rate
      const currentSpending = budget.categories
        .filter(c => c.categoryType === 'EXPENSE')
        .reduce((sum, cat) => sum + cat.spentAmount, 0);
      
      const dailyAverage = currentSpending / Math.max(daysElapsed, 1);

      // Project to end of period
      const projectedSpending = dailyAverage * totalDays;
      const projectedIncome = budget.totalIncome || 0;
      const projectedSavings = projectedIncome - projectedSpending;

      // Category-level forecasts
      const categoryForecasts: Record<string, any> = {};
      const alerts: string[] = [];

      for (const category of budget.categories) {
        const categoryDaily = category.spentAmount / Math.max(daysElapsed, 1);
        const projected = categoryDaily * totalDays;
        const percentageUsed = (projected / category.budgetedAmount) * 100;

        // Determine trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (percentageUsed > 110) {
          trend = 'increasing';
        } else if (percentageUsed < 80) {
          trend = 'decreasing';
        }

        // Calculate confidence based on consistency
        const confidence = Math.min(0.95, 0.5 + (daysElapsed / totalDays) * 0.45);

        categoryForecasts[category.name] = {
          projected,
          confidence,
          trend,
          budgeted: category.budgetedAmount,
          percentageProjected: percentageUsed
        };

        // Generate alerts
        if (projected > category.budgetedAmount) {
          const overage = projected - category.budgetedAmount;
          alerts.push(
            `${category.name}: Projected to exceed budget by $${overage.toFixed(2)} (${percentageUsed.toFixed(0)}%)`
          );
        }
      }

      // Overall confidence
      const overallConfidence = Math.min(0.95, 0.6 + (daysElapsed / totalDays) * 0.35);

      // Generate AI recommendations
      const recommendations = await this.generateAIRecommendations(
        userId,
        budget,
        projectedSpending,
        categoryForecasts
      );

      // Save forecast to database
      await prisma.spendingForecast.create({
        data: {
          userId,
          budgetId,
          forecastDate,
          projectedSpending,
          projectedIncome,
          projectedSavings,
          categoryForecasts: JSON.stringify(categoryForecasts),
          confidence: overallConfidence,
          alerts: JSON.stringify(alerts),
          aiInsights: JSON.stringify({ recommendations })
        }
      });

      logger.info('Forecast generated', { userId, budgetId, projectedSpending, confidence: overallConfidence });

      return {
        forecastDate,
        projectedSpending,
        projectedIncome,
        projectedSavings,
        categoryForecasts,
        alerts,
        recommendations,
        confidence: overallConfidence
      };
    } catch (error: any) {
      logger.error('Failed to generate forecast', { userId, budgetId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(
    userId: string,
    budget: any,
    projectedSpending: number,
    categoryForecasts: Record<string, any>
  ): Promise<string[]> {
    try {
      // Get historical spending patterns
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: budget.startDate,
            lt: new Date()
          }
        },
        orderBy: { date: 'desc' },
        take: 100
      });

      // Find problem categories
      const problemCategories = Object.entries(categoryForecasts)
        .filter(([_, data]: [string, any]) => data.percentageProjected > 100)
        .map(([name, data]: [string, any]) => ({
          name,
          overage: data.projected - data.budgeted,
          percentage: data.percentageProjected
        }))
        .sort((a, b) => b.overage - a.overage);

      const recommendations: string[] = [];

      // Rule-based recommendations
      if (projectedSpending > budget.totalBudget) {
        const overage = projectedSpending - budget.totalBudget;
        recommendations.push(
          `Reduce spending by $${(overage / Math.max(budget.categories.length, 1)).toFixed(2)} per category to stay on budget`
        );
      }

      for (const problem of problemCategories.slice(0, 2)) {
        const reductionNeeded = problem.overage;
        recommendations.push(
          `${problem.name}: Cut back by $${reductionNeeded.toFixed(2)} to avoid overspending`
        );
      }

      // Find underutilized categories
      const underutilized = Object.entries(categoryForecasts)
        .filter(([_, data]: [string, any]) => data.percentageProjected < 70)
        .map(([name, data]: [string, any]) => ({
          name,
          unused: data.budgeted - data.projected
        }))
        .sort((a, b) => b.unused - a.unused);

      if (underutilized.length > 0 && problemCategories.length > 0) {
        const source = underutilized[0];
        const target = problemCategories[0];
        recommendations.push(
          `Consider reallocating $${Math.min(source.unused, target.overage).toFixed(2)} from ${source.name} to ${target.name}`
        );
      }

      // AI-enhanced recommendations (if OpenAI available)
      if (process.env.OPENAI_API_KEY && problemCategories.length > 0) {
        try {
          const aiPrompt = `Based on this spending data:
- Budget: $${budget.totalBudget}
- Projected: $${projectedSpending}
- Problem areas: ${problemCategories.map(p => `${p.name} (${p.percentage.toFixed(0)}%)`).join(', ')}

Give 2 specific, actionable recommendations to reduce spending. Be concise and practical.`;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: 'You are a personal finance advisor. Give brief, actionable advice.' },
              { role: 'user', content: aiPrompt }
            ],
            max_tokens: 150,
            temperature: 0.7
          });

          const aiRec = completion.choices[0].message.content;
          if (aiRec) {
            const lines = aiRec.split('\n').filter(l => l.trim().length > 0);
            recommendations.push(...lines.slice(0, 2));
          }
        } catch (aiError) {
          logger.warn('AI recommendations failed, using rule-based only', { aiError });
        }
      }

      return recommendations.slice(0, 5); // Top 5 recommendations
    } catch (error: any) {
      logger.error('Failed to generate AI recommendations', { error: error.message });
      return [];
    }
  }

  /**
   * Detect spending anomalies
   */
  async detectAnomalies(userId: string): Promise<any[]> {
    try {
      // Get last 60 days of transactions
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: sixtyDaysAgo }
        },
        orderBy: { date: 'desc' }
      });

      // Calculate average and std deviation per category
      const categoryStats: Record<string, { avg: number; stdDev: number; transactions: any[] }> = {};

      for (const tx of transactions) {
        if (!tx.category) continue;
        
        if (!categoryStats[tx.category]) {
          categoryStats[tx.category] = { avg: 0, stdDev: 0, transactions: [] };
        }
        categoryStats[tx.category].transactions.push(tx);
      }

      const anomalies: any[] = [];

      for (const [category, stats] of Object.entries(categoryStats)) {
        const amounts = stats.transactions.map(tx => Math.abs(tx.amount));
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);

        stats.avg = avg;
        stats.stdDev = stdDev;

        // Find transactions > 2 standard deviations from mean
        for (const tx of stats.transactions) {
          const amount = Math.abs(tx.amount);
          if (amount > avg + (2 * stdDev)) {
            anomalies.push({
              transaction: tx,
              category,
              amount,
              averageForCategory: avg,
              standardDeviations: (amount - avg) / stdDev,
              severity: amount > avg + (3 * stdDev) ? 'high' : 'medium'
            });
          }
        }
      }

      return anomalies.sort((a, b) => b.standardDeviations - a.standardDeviations);
    } catch (error: any) {
      logger.error('Failed to detect anomalies', { userId, error: error.message });
      return [];
    }
  }
}

export const forecastingService = ForecastingService.getInstance();

