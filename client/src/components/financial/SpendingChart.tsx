import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface SpendingChartProps {
  categories: CategorySpending[];
  totalBudget: number;
}

export function SpendingChart({ categories, totalBudget }: SpendingChartProps) {
  const totalSpent = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const percentageUsed = (totalSpent / totalBudget) * 100;

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Budget Overview
          </CardTitle>
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            percentageUsed > 90 ? 'text-red-600' : percentageUsed > 75 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {percentageUsed > 75 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {percentageUsed.toFixed(0)}% used
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Monthly Budget</span>
            <span className="font-bold text-gray-900">
              ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${Math.min(percentageUsed, 100)}%`,
                backgroundImage: percentageUsed > 90 
                  ? 'linear-gradient(to right, rgb(239 68 68), rgb(249 115 22))'
                  : percentageUsed > 75
                  ? 'linear-gradient(to right, rgb(234 179 8), rgb(245 158 11))'
                  : 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))'
              }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">Spending by Category</div>
          {categories.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-700">{category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">{category.percentage}%</span>
                  <span className="font-semibold text-gray-900">${category.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart (Simple SVG) */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-700 mb-3">Distribution</div>
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {categories.reduce((acc, category, index) => {
                const startAngle = acc.angle;
                const sliceAngle = (category.percentage / 100) * 360;
                const endAngle = startAngle + sliceAngle;
                
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                const x1 = 100 + 80 * Math.cos(startRad);
                const y1 = 100 + 80 * Math.sin(startRad);
                const x2 = 100 + 80 * Math.cos(endRad);
                const y2 = 100 + 80 * Math.sin(endRad);
                
                const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                
                const pathData = [
                  `M 100 100`,
                  `L ${x1} ${y1}`,
                  `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`
                ].join(' ');
                
                acc.paths.push(
                  <path
                    key={index}
                    d={pathData}
                    fill={category.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                );
                
                acc.angle = endAngle;
                return acc;
              }, { paths: [] as JSX.Element[], angle: 0 }).paths}
              
              {/* Center white circle (donut effect) */}
              <circle cx="100" cy="100" r="50" fill="white" />
            </svg>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-gray-700">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

