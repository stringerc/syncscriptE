import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateRevenueImpact } from './RevenueOptimizer';

interface RevenueCalculatorProps {
  onRevenueChange?: (revenue: number) => void;
}

export const RevenueCalculator: React.FC<RevenueCalculatorProps> = ({ onRevenueChange }) => {
  const [visitors, setVisitors] = useState(1000);
  const [conversionRate, setConversionRate] = useState(2);
  const [price, setPrice] = useState(39);
  const [optimize, setOptimize] = useState(true);
  
  const [results, setResults] = useState(calculateRevenueImpact({
    visitors,
    conversionRate,
    price,
    optimizeConversion: optimize
  }));

  useEffect(() => {
    const newResults = calculateRevenueImpact({
      visitors,
      conversionRate,
      price,
      optimizeConversion: optimize
    });
    
    setResults(newResults);
    onRevenueChange?.(newResults.revenue);
  }, [visitors, conversionRate, price, optimize, onRevenueChange]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-xl p-6 space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Revenue Impact Calculator
        </h2>
        <p className="text-gray-600">
          See how SyncScript can impact your bottom line
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Visitors
          </label>
          <input
            type="number"
            value={visitors}
            onChange={(e) => setVisitors(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conversion Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Price ($)
          </label>
          <input
            type="number"
            step="5"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={optimize}
            onChange={(e) => setOptimize(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            Include optimization (+20% conversion boost)
          </span>
        </label>
      </div>

      <motion.div
        key={results.revenue}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white"
      >
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold">${results.revenue}</div>
            <div className="text-sm opacity-90">Monthly Revenue</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold">{results.units}</div>
            <div className="text-sm opacity-90">Customers/Month</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold">{results.conversionRate}%</div>
            <div className="text-sm opacity-90">Conversion Rate</div>
          </div>
        </div>
      </motion.div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-medium">
          💡 Pro tip: {optimize ? 'Your optimized setup is generating' : 'Turning on optimization could add'}
          <span className="text-yellow-900 font-bold"> ${results.revenue - (visitors * (conversionRate/100) * price)}</span> 
          extra monthly revenue through smart conversion optimization!
        </p>
      </div>
    </motion.div>
  );
};