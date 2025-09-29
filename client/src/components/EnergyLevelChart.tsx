import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface EnergyDataPoint {
  date: string
  energy: number
  epEarned: number
  challengesCompleted: number
  isWeekend: boolean
  milestones: string[]
}

interface EnergyLevelChartProps {
  className?: string
}

export function EnergyLevelChart({ className }: EnergyLevelChartProps) {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')
  const [showMovingAverage, setShowMovingAverage] = useState(true)
  const [showMilestones, setShowMilestones] = useState(true)
  const [showWeekends, setShowWeekends] = useState(true)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  // Generate mock data based on time range
  const energyData = useMemo((): EnergyDataPoint[] => {
    const data: EnergyDataPoint[] = []
    const days = parseInt(timeRange)
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      // Generate realistic energy data with some patterns (0-10 scale)
      let baseEnergy = 5 + Math.sin(i * 0.2) * 2 + Math.random() * 3
      if (isWeekend) baseEnergy += 1 // Slightly higher on weekends
      
      const energy = Math.max(0, Math.min(10, baseEnergy))
      const epEarned = Math.floor(energy) + Math.floor(Math.random() * 3)
      const challengesCompleted = Math.floor(energy / 2) + Math.floor(Math.random() * 2)
      
      // Generate milestones
      const milestones: string[] = []
      if (energy >= 5 && (i === 0 || data[data.length - 1]?.energy < 5)) {
        milestones.push('5+ Energy')
      }
      if (energy >= 7 && (i === 0 || data[data.length - 1]?.energy < 7)) {
        milestones.push('7+ Energy')
      }
      if (energy >= 9 && (i === 0 || data[data.length - 1]?.energy < 9)) {
        milestones.push('9+ Energy')
      }
      if (challengesCompleted >= 3) {
        milestones.push('3+ Challenges')
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        energy,
        epEarned,
        challengesCompleted,
        isWeekend,
        milestones
      })
    }
    
    return data
  }, [timeRange])

  // Calculate 7-day moving average
  const movingAverageData = useMemo(() => {
    if (!showMovingAverage) return []
    
    const result: number[] = []
    for (let i = 0; i < energyData.length; i++) {
      const start = Math.max(0, i - 6)
      const slice = energyData.slice(start, i + 1)
      const average = slice.reduce((sum, point) => sum + point.energy, 0) / slice.length
      result.push(average)
    }
    return result
  }, [energyData, showMovingAverage])

  // Chart dimensions - use responsive sizing
  const chartWidth = 100 // Use percentage-based coordinates
  const chartHeight = 100
  const padding = 10

  // Calculate data point positions using percentage coordinates
  const dataPoints = energyData.map((point, index) => {
    const x = padding + (index / (energyData.length - 1)) * (chartWidth - 2 * padding)
    const y = padding + (1 - point.energy / 10) * (chartHeight - 2 * padding)
    return { x, y, ...point }
  })

  // Calculate moving average positions
  const movingAveragePoints = movingAverageData.map((value, index) => {
    const x = padding + (index / (energyData.length - 1)) * (chartWidth - 2 * padding)
    const y = padding + (1 - value / 10) * (chartHeight - 2 * padding)
    return { x, y, value }
  })

  // Create SVG path for the main line
  const pathData = dataPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  // Create SVG path for moving average
  const movingAveragePath = movingAveragePoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  // Get color based on energy level
  const getEnergyColor = (energy: number) => {
    if (energy >= 7) return '#ef4444' // High (red)
    if (energy >= 4) return '#10b981' // Optimal (green)
    return '#f59e0b' // Low (yellow)
  }

  // Calculate statistics
  const avgEnergy = energyData.reduce((sum, d) => sum + d.energy, 0) / energyData.length
  const maxEnergy = Math.max(...energyData.map(d => d.energy))
  const minEnergy = Math.min(...energyData.map(d => d.energy))
  const totalEP = energyData.reduce((sum, d) => sum + d.epEarned, 0)
  const totalChallenges = energyData.reduce((sum, d) => sum + d.challengesCompleted, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Energy Analysis</CardTitle>
        
        {/* Time Range Controls */}
        <div className="flex space-x-2 mb-4">
          {(['7', '30', '90'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range} days
            </Button>
          ))}
        </div>

        {/* Overlay Controls */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Switch
              id="moving-average"
              checked={showMovingAverage}
              onCheckedChange={setShowMovingAverage}
            />
            <Label htmlFor="moving-average">7-day average</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="milestones"
              checked={showMilestones}
              onCheckedChange={setShowMilestones}
            />
            <Label htmlFor="milestones">Milestones</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="weekends"
              checked={showWeekends}
              onCheckedChange={setShowWeekends}
            />
            <Label htmlFor="weekends">Weekend stripes</Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{avgEnergy.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Energy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{maxEnergy}</div>
            <div className="text-sm text-muted-foreground">Peak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{totalEP}</div>
            <div className="text-sm text-muted-foreground">EP Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{totalChallenges}</div>
            <div className="text-sm text-muted-foreground">Challenges</div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg p-4">
          <svg
            className="w-full h-[300px]"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Energy Bands */}
            <defs>
              <linearGradient id="optimalBand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="lowBand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="highBand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Optimal Zone (4-7) */}
            <rect
              x={padding}
              y={padding + (1 - 7 / 10) * (chartHeight - 2 * padding)}
              width={chartWidth - 2 * padding}
              height={(7 - 4) / 10 * (chartHeight - 2 * padding)}
              fill="url(#optimalBand)"
            />

            {/* Low Zone (0-4) */}
            <rect
              x={padding}
              y={padding + (1 - 4 / 10) * (chartHeight - 2 * padding)}
              width={chartWidth - 2 * padding}
              height={4 / 10 * (chartHeight - 2 * padding)}
              fill="url(#lowBand)"
            />

            {/* High Zone (7-10) */}
            <rect
              x={padding}
              y={padding}
              width={chartWidth - 2 * padding}
              height={(1 - 7 / 10) * (chartHeight - 2 * padding)}
              fill="url(#highBand)"
            />

            {/* Weekend Stripes */}
            {showWeekends && dataPoints.map((point, index) => {
              if (!point.isWeekend) return null
              const x = padding + (index / (energyData.length - 1)) * (chartWidth - 2 * padding)
              const nextX = index < dataPoints.length - 1 
                ? padding + ((index + 1) / (energyData.length - 1)) * (chartWidth - 2 * padding)
                : chartWidth - padding
              
              return (
                <rect
                  key={index}
                  x={x}
                  y={padding}
                  width={nextX - x}
                  height={chartHeight - 2 * padding}
                  fill="rgba(255, 255, 255, 0.05)"
                />
              )
            })}

            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((level) => {
              const y = padding + (1 - level / 10) * (chartHeight - 2 * padding)
              return (
                <g key={level}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-400"
                  >
                    {level}
                  </text>
                </g>
              )
            })}

            {/* Moving Average Line */}
            {showMovingAverage && (
              <path
                d={movingAveragePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            )}

            {/* Main Energy Line */}
            <path
              d={pathData}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {dataPoints.map((point, index) => {
              const isHovered = hoveredPoint === index
              const color = getEnergyColor(point.energy)
              
              return (
                <g key={index}>
                  {/* Hover area */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Data point */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? "4" : "3"}
                    fill={color}
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="1"
                    className="transition-all duration-200"
                  />
                </g>
              )
            })}

            {/* Milestone Markers */}
            {showMilestones && dataPoints.map((point, index) => {
              if (point.milestones.length === 0) return null
              
              return (
                <g key={`milestone-${index}`}>
                  {/* Milestone pin */}
                  <polygon
                    points={`${point.x},${point.y - 8} ${point.x - 3},${point.y - 2} ${point.x + 3},${point.y - 2}`}
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y - 2}
                    r="2"
                    fill="#fbbf24"
                  />
                </g>
              )
            })}
          </svg>

          {/* Time Labels */}
          <div className="absolute bottom-0 left-0 right-0 h-8">
            {dataPoints.map((point, index) => {
              if (index % Math.ceil(dataPoints.length / 8) !== 0) return null
              
              return (
                <div
                  key={index}
                  className="absolute text-xs text-gray-400 text-center"
                  style={{
                    left: `${point.x}%`,
                    transform: 'translateX(-50%)',
                    bottom: '0px'
                  }}
                >
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )
            })}
          </div>

          {/* Hover Tooltip */}
          {hoveredPoint !== null && (
            <div
              className="absolute bg-gray-800 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg border border-gray-600 dark:border-gray-500 pointer-events-none z-10"
              style={{
                left: `${dataPoints[hoveredPoint].x}%`,
                top: `${dataPoints[hoveredPoint].y}%`,
                transform: 'translate(-50%, -120%)'
              }}
            >
              <div className="font-medium">
                {new Date(dataPoints[hoveredPoint].date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-blue-300">
                Energy: {dataPoints[hoveredPoint].energy.toFixed(1)}/10
              </div>
              {hoveredPoint > 0 && (
                <div className="text-green-300">
                  Δ: {((dataPoints[hoveredPoint].energy - dataPoints[hoveredPoint - 1].energy) > 0 ? '+' : '')}
                  {(dataPoints[hoveredPoint].energy - dataPoints[hoveredPoint - 1].energy).toFixed(1)}
                </div>
              )}
              <div className="text-yellow-300">
                EP: {dataPoints[hoveredPoint].epEarned}
              </div>
              <div className="text-purple-300">
                Challenges: {dataPoints[hoveredPoint].challengesCompleted}
              </div>
              {dataPoints[hoveredPoint].milestones.length > 0 && (
                <div className="text-orange-300 text-xs mt-1">
                  {dataPoints[hoveredPoint].milestones.join(', ')}
                </div>
              )}
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Optimal (4-7)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">Low (0-4)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">High (7-10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-blue-500 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 5px, transparent 5px, transparent 10px)' }}></div>
            <span className="text-gray-400">7-day avg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}