/**
 * Mock energy data for insights dashboard
 */

export interface EnergyDataPoint {
  time: string;
  level: number; // 0-100
  label: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
}

export interface EnergyInsight {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
}

/**
 * Last 7 days of energy data (one reading per day)
 */
export const mockWeekData: EnergyDataPoint[] = [
  { time: 'Mon', level: 65, label: 'HIGH' },
  { time: 'Tue', level: 85, label: 'PEAK' },
  { time: 'Wed', level: 55, label: 'MEDIUM' },
  { time: 'Thu', level: 75, label: 'HIGH' },
  { time: 'Fri', level: 90, label: 'PEAK' },
  { time: 'Sat', level: 45, label: 'MEDIUM' },
  { time: 'Sun', level: 70, label: 'HIGH' },
];

/**
 * Today's energy data (hourly readings)
 */
export const mockTodayData: EnergyDataPoint[] = [
  { time: '6am', level: 40, label: 'MEDIUM' },
  { time: '8am', level: 65, label: 'HIGH' },
  { time: '10am', level: 90, label: 'PEAK' },
  { time: '12pm', level: 75, label: 'HIGH' },
  { time: '2pm', level: 55, label: 'MEDIUM' },
  { time: '4pm', level: 70, label: 'HIGH' },
  { time: '6pm', level: 45, label: 'MEDIUM' },
  { time: '8pm', level: 35, label: 'LOW' },
];

/**
 * Month view data (one reading per day for 30 days)
 */
export const mockMonthData: EnergyDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  // Simulate realistic patterns
  const baseLevel = 60;
  const weekendFactor = (day % 7 === 0 || day % 7 === 6) ? -10 : 0;
  const randomVariation = Math.random() * 30 - 15;
  const level = Math.max(20, Math.min(100, baseLevel + weekendFactor + randomVariation));
  
  let label: EnergyDataPoint['label'];
  if (level >= 80) label = 'PEAK';
  else if (level >= 60) label = 'HIGH';
  else if (level >= 40) label = 'MEDIUM';
  else label = 'LOW';
  
  return {
    time: `Day ${day}`,
    level: Math.round(level),
    label,
  };
});

