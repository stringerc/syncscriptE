import { useState, useEffect } from 'react';

interface RevenueData {
  monthlyVisitors: number;
  conversionRate: number;
  averageMonthlyPrice: number;
  monthlyRecurringRevenue: number;
  totalCustomers: number;
  customerGrowthRate: number;
  revenueGrowthRate: number;
}

interface RevenueAnalyticsReturn {
  revenue: RevenueData;
  optimize: () => void;
  reset: () => void;
  isOptimized: boolean;
}

export const useRevenueAnalytics = (
  initialVisitors: number = 1000,
  initialConversionRate: number = 2,
  initialPrice: number = 39
): RevenueAnalyticsReturn => {
  const [revenue, setRevenue] = useState<RevenueData>({
    monthlyVisitors: initialVisitors,
    conversionRate: initialConversionRate,
    averageMonthlyPrice: initialPrice,
    monthlyRecurringRevenue: 780,
    totalCustomers: 20,
    customerGrowthRate: 0,
    revenueGrowthRate: 0
  });

  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    const updateRevenue = () => {
      const newCustomers = revenue.monthlyVisitors * (revenue.conversionRate / 100);
      const newMRR = newCustomers * revenue.averageMonthlyPrice;
      const growthRate = ((newMRR - revenue.monthlyRecurringRevenue) / revenue.monthlyRecurringRevenue) * 100;
      const customerGrowth = ((newCustomers - revenue.totalCustomers) / revenue.totalCustomers) * 100;

      setRevenue(prev => ({
        ...prev,
        monthlyRecurringRevenue: Math.round(newMRR),
        totalCustomers: Math.round(newCustomers),
        revenueGrowthRate: Math.round(growthRate),
        customerGrowthRate: Math.round(customerGrowth)
      }));
    };

    updateRevenue();
  }, [revenue.monthlyVisitors, revenue.conversionRate, revenue.averageMonthlyPrice]);

  const optimize = () => {
    if (!isOptimized) {
      setRevenue(prev => ({
        ...prev,
        conversionRate: Math.min(prev.conversionRate + 20, 25),
        averageMonthlyPrice: 39 // Optimal price point for SyncScript
      }));
      setIsOptimized(true);
    }
  };

  const reset = () => {
    setRevenue(prev => ({
      ...prev,
      conversionRate: initialConversionRate,
      averageMonthlyPrice: initialPrice
    }));
    setIsOptimized(false);
  };

  return {
    revenue,
    optimize,
    reset,
    isOptimized
  };
};