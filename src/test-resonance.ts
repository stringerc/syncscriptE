/**
 * Quick Test: Resonance Calculus
 * 
 * Verify the resonance engine is calculating correctly
 * Run this in browser console on Tasks page
 */

import { calculateResonanceScore, getCircadianCurve, calculateCoherence } from './utils/resonance-calculus';

// Test 1: Circadian Curve
console.log('=== TEST 1: Circadian Curve ===');
console.log('9 AM (peak):', getCircadianCurve(9)); // Should be ~1.0
console.log('2 PM (dip):', getCircadianCurve(14)); // Should be ~0.65
console.log('10 PM (low):', getCircadianCurve(22)); // Should be ~0.60

// Test 2: Task Resonance at Different Times
console.log('\n=== TEST 2: Same Task, Different Times ===');

const testTask = {
  id: 'test-1',
  title: 'Deep work coding',
  energyLevel: 'high' as const,
  estimatedDuration: 90,
  category: 'work',
  priority: 'high' as const,
  completed: false,
  dueDate: new Date().toISOString(),
  description: 'Test task',
  tags: [],
  createdDate: new Date().toISOString(),
};

const mockContext = {
  currentTime: new Date(),
  schedule: [],
  completedTasksToday: 3,
  recentTaskSwitches: 1,
  cognitiveLoad: 0.2,
  dayStart: new Date(new Date().setHours(0, 0, 0, 0)),
};

// Morning slot (9 AM - should be excellent)
const morningSlot = {
  startTime: new Date(new Date().setHours(9, 0, 0, 0)),
  endTime: new Date(new Date().setHours(10, 30, 0, 0)),
  hour: 9,
  duration: 90,
  naturalEnergy: 'high' as const,
};

// Afternoon slot (2 PM - should be poor)
const afternoonSlot = {
  startTime: new Date(new Date().setHours(14, 0, 0, 0)),
  endTime: new Date(new Date().setHours(15, 30, 0, 0)),
  hour: 14,
  duration: 90,
  naturalEnergy: 'low' as const,
};

const morningScore = calculateResonanceScore(testTask, morningSlot, mockContext);
const afternoonScore = calculateResonanceScore(testTask, afternoonSlot, mockContext);

console.log('\n9 AM (High energy task in high energy slot):');
console.log('  Overall:', morningScore.overall.toFixed(2));
console.log('  Recommendation:', morningScore.recommendation);
console.log('  Energy alignment:', morningScore.components.energyAlignment.toFixed(2));

console.log('\n2 PM (High energy task in low energy slot):');
console.log('  Overall:', afternoonScore.overall.toFixed(2));
console.log('  Recommendation:', afternoonScore.recommendation);
console.log('  Energy alignment:', afternoonScore.components.energyAlignment.toFixed(2));

console.log('\nExpected: Morning should be MUCH better (0.85+) vs afternoon (0.30-0.50)');
console.log('Improvement:', ((morningScore.overall / afternoonScore.overall - 1) * 100).toFixed(1) + '%');

// Test 3: Coherence Factors
console.log('\n=== TEST 3: Coherence Factor Breakdown ===');
const coherence = calculateCoherence(testTask, morningSlot, mockContext);
console.log('Energy Alignment:', coherence.energyAlignment.toFixed(2));
console.log('Context Match:', coherence.contextMatch.toFixed(2));
console.log('Schedule Flow:', coherence.scheduleFlow.toFixed(2));
console.log('Timing Optimal:', coherence.timingOptimal.toFixed(2));

console.log('\n✅ If you see meaningful differences between morning and afternoon, the engine is working!');
