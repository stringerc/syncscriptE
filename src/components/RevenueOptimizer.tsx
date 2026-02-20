import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RevenueOptimizerProps {
  currentPrice: number;
  targetPrice: number;
  visitors: number;
  conversionRate: number;
}

export const RevenueOptimizer: React.FC<RevenueOptimizerProps> = ({
  currentPrice,
  targetPrice,
  visitors,
  conversionRate
}) => {
  const [revenueProjections, setRevenueProjections] = useState({
    current: 0,
    projected: 0,
    improvement: 0
  });

  useEffect(() => {
    const currentRevenue = visitors * (conversionRate / 100) * currentPrice;
    const projectedRevenue = visitors * ((conversionRate + 20) / 100) * targetPrice;
    const improvement = ((projectedRevenue - currentRevenue) / currentRevenue) * 100;

    setRevenueProjections({
      current: Math.round(currentRevenue),
      projected: Math.round(projectedRevenue),
      improvement: Math.round(improvement)
    });
  }, [currentPrice, targetPrice, visitors, conversionRate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-6"
    >
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Revenue Intelligence
          </h3>
          <p className="text-gray-600">Smart pricing analysis in real-time</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-red-600">
              ${revenueProjections.current}
            </div>
            <div className="text-sm text-gray-600">
              Current Revenue
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">
              ${revenueProjections.projected}
            </div>
            <div className="text-sm text-gray-600">
              Projected Revenue
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-3xl font-bold ${
            revenueProjections.improvement > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            +{revenueProjections.improvement}%
          </div>
          <div className="text-sm text-gray-600">
            Revenue Boost Potential
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">
            Optimization Suggestion: Price at ${targetPrice}/month with 20% conversion boost for ${revenueProjections.projected - revenueProjections.current} additional MRR
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Revenue calculator utility for instant testing
export const calculateRevenueImpact = (options: {
  visitors: number;
  conversionRate: number;
  price: number;
  optimizeConversion?: boolean;
}) => {
  const optimizedConversionRate = options.optimizeConversion
    ? Math.min(options.conversionRate + 20, 25)
    : options.conversionRate;

  const revenue = options.visitors * (optimizedConversionRate / 100) * options.price;
  
  return {
    revenue: Math.round(revenue),
    conversionRate: optimizedConversionRate,
    units: Math.round(options.visitors * (optimizedConversionRate / 100))
  };
};