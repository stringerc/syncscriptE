import { useTasks } from '../contexts/TasksContext';
import { useEffect } from 'react';

/**
 * DIAGNOSTIC COMPONENT - Tasks Context Validation
 * 
 * This component validates that toggleTaskCompletion is properly available
 * in the TasksContext. It should only run once on app mount.
 * 
 * Add this to App.tsx inside the TasksProvider to diagnose issues.
 */
export function TasksContextDiagnostic() {
  const tasksContext = useTasks();
  
  useEffect(() => {
    // Delay diagnostic to ensure tasks are loaded
    const diagnosticTimer = setTimeout(() => {
      console.log('='.repeat(80));
      console.log('🔬 TASKS CONTEXT DIAGNOSTIC');
      console.log('='.repeat(80));
      
      // Check if context exists
      if (!tasksContext) {
        console.error('❌ CRITICAL: tasksContext is null or undefined!');
        console.error('   This means useTasks() is being called outside TasksProvider');
        return;
      }
      console.log('✅ tasksContext exists');
      
      // Check if toggleTaskCompletion exists
      if (!tasksContext.toggleTaskCompletion) {
        console.error('❌ CRITICAL: toggleTaskCompletion is missing from context!');
        console.error('   Context keys:', Object.keys(tasksContext));
        console.error('   Full context:', tasksContext);
        return;
      }
      console.log('✅ toggleTaskCompletion exists in context');
      
      // Check if it's a function
      if (typeof tasksContext.toggleTaskCompletion !== 'function') {
        console.error('❌ CRITICAL: toggleTaskCompletion is not a function!');
        console.error('   Type:', typeof tasksContext.toggleTaskCompletion);
        console.error('   Value:', tasksContext.toggleTaskCompletion);
        return;
      }
      console.log('✅ toggleTaskCompletion is a function');
      
      // Test destructuring
      const { toggleTaskCompletion, tasks } = tasksContext;
      if (!toggleTaskCompletion) {
        console.error('❌ CRITICAL: toggleTaskCompletion lost during destructuring!');
        return;
      }
      console.log('✅ toggleTaskCompletion survives destructuring');
      
      if (typeof toggleTaskCompletion !== 'function') {
        console.error('❌ CRITICAL: toggleTaskCompletion type changed during destructuring!');
        console.error('   New type:', typeof toggleTaskCompletion);
        return;
      }
      console.log('✅ toggleTaskCompletion remains a function after destructuring');
      
      // Check if tasks are loaded
      console.log(`📊 Tasks loaded: ${tasks.length} tasks available`);
      if (tasks.length > 0) {
        console.log('   Sample task IDs:', tasks.slice(0, 5).map(t => t.id).join(', '));
      }
      
      console.log('='.repeat(80));
      console.log('✅ ALL CHECKS PASSED - toggleTaskCompletion is properly configured');
      console.log('='.repeat(80));
      
      // Optional: Test calling it with invalid ID (commented out to reduce noise)
      // Uncomment if you need to test error handling
      /*
      console.log('🧪 Testing error handling with invalid ID...');
      toggleTaskCompletion('diagnostic-test-invalid-id').catch((err) => {
        console.log('✅ Error handling works correctly');
        console.log('   Error message:', err.message);
      });
      */
      
    }, 1000); // Wait 1 second for tasks to load
    
    return () => clearTimeout(diagnosticTimer);
  }, [tasksContext]);
  
  // This component doesn't render anything
  return null;
}
