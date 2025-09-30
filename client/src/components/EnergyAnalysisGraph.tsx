import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EnergyDataPoint {
  date: string
  timestamp: number
  energy: number // 0-100 internal
  displayEnergy: number // 0-10 for display
  energyPoints: number
  challengesCompleted: number
  movingAverage?: number
}

interface EnergyAnalysisGraphProps {
  data: EnergyDataPoint[]
  className?: string
}

type TimeRange = 'day' | 'week' | 'month' | 'year'

export function EnergyAnalysisGraph({ data, className = '' }: EnergyAnalysisGraphProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = Date.now()
    let cutoff: number

    switch (timeRange) {
      case 'day':
        cutoff = now - 24 * 60 * 60 * 1000
        break
      case 'week':
        cutoff = now - 7 * 24 * 60 * 60 * 1000
        break
      case 'month':
        cutoff = now - 30 * 24 * 60 * 60 * 1000
        break
      case 'year':
        cutoff = now - 365 * 24 * 60 * 60 * 1000
        break
      default:
        cutoff = now - 7 * 24 * 60 * 60 * 1000
    }

    const filtered = data.filter(d => d.timestamp >= cutoff)

    // Calculate 7-day moving average
    return filtered.map((point, index) => {
      const window = filtered.slice(Math.max(0, index - 6), index + 1)
      const movingAverage = window.reduce((sum, p) => sum + p.displayEnergy, 0) / window.length

      return {
        ...point,
        movingAverage
      }
    })
  }, [data, timeRange])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    const prevData = filteredData[filteredData.indexOf(data) - 1]
    const delta = prevData ? data.displayEnergy - prevData.displayEnergy : 0

    return (
      <Card className="p-3 shadow-lg border">
        <div className="space-y-1">
          <p className="font-medium text-sm">{data.date}</p>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <p className="text-sm">
              Energy: <span className="font-bold">{data.displayEnergy.toFixed(1)}/10</span>
            </p>
          </div>
          {delta !== 0 && (
            <p className={`text-xs ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} vs yesterday
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            EP earned: {data.energyPoints}
          </p>
          <p className="text-xs text-muted-foreground">
            Challenges: {data.challengesCompleted}
          </p>
          {data.movingAverage && (
            <p className="text-xs text-muted-foreground">
              7-day avg: {data.movingAverage.toFixed(1)}
            </p>
          )}
        </div>
      </Card>
    )
  }

  // Format X-axis based on time range
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp)
    
    switch (timeRange) {
      case 'day':
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short' })
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Identify weekends for shading
  const isWeekend = (timestamp: number) => {
    const day = new Date(timestamp).getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Energy Trend</h3>
        <div className="flex space-x-2">
          {(['day', 'week', 'month', 'year'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="w-full h-80 bg-card rounded-lg border p-4">
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No energy data available for this time range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              
              <YAxis
                domain={[0, 10]}
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                label={{ value: 'Energy Level', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9ca3af' } }}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {/* Weekend shading */}
              {filteredData.map((point, index) => {
                if (!isWeekend(point.timestamp)) return null
                const nextPoint = filteredData[index + 1]
                if (!nextPoint) return null

                return (
                  <ReferenceLine
                    key={`weekend-${index}`}
                    segment={[
                      { x: point.timestamp, y: 0 },
                      { x: point.timestamp, y: 10 }
                    ]}
                    stroke="#f3f4f6"
                    strokeWidth={nextPoint.timestamp - point.timestamp}
                    opacity={0.3}
                  />
                )
              })}

              {/* Milestone markers (e.g., at energy = 7.5) */}
              <ReferenceLine y={7.5} stroke="#10b981" strokeDasharray="5 5" opacity={0.5} />

              {/* Area under the curve */}
              <Area
                type="monotone"
                dataKey="displayEnergy"
                stroke="none"
                fill="url(#energyGradient)"
              />

              {/* 7-day moving average */}
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="7-day avg"
              />

              {/* Main energy line */}
              <Line
                type="monotone"
                dataKey="displayEnergy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Energy"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Energy Level</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-gray-400 border-dashed"></div>
          <span>7-day Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Weekend</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
          <span>High Energy (7.5+)</span>
        </div>
      </div>
    </div>
  )
}
