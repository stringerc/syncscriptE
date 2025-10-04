/**
 * ESLint Configuration for Import Boundaries
 * 
 * This configuration enforces module boundaries to prevent
 * cross-context imports and maintain clean architecture.
 */

module.exports = {
  extends: [
    './.eslintrc.js'
  ],
  plugins: [
    'import'
  ],
  rules: {
    // Enforce import boundaries
    'import/no-restricted-paths': [
      'error',
      {
        // Block cross-context imports
        zones: [
          {
            target: './src/services/gamificationService.ts',
            from: './src/services/energyEngineService.ts',
            message: 'Gamification service should not import from energy engine directly. Use events or adapters.'
          },
          {
            target: './src/services/scriptsService.ts',
            from: './src/services/taskSchedulingService.ts',
            message: 'Scripts service should not import from task scheduling directly. Use events or adapters.'
          },
          {
            target: './src/services/budgetService.ts',
            from: './src/services/energyEngineService.ts',
            message: 'Budget service should not import from energy engine directly. Use events or adapters.'
          },
          {
            target: './src/services/exportService.ts',
            from: './src/services/scriptsService.ts',
            message: 'Export service should not import from scripts service directly. Use events or adapters.'
          },
          {
            target: './src/services/exportService.ts',
            from: './src/services/budgetService.ts',
            message: 'Export service should not import from budget service directly. Use events or adapters.'
          },
          {
            target: './src/services/exportService.ts',
            from: './src/services/gamificationService.ts',
            message: 'Export service should not import from gamification service directly. Use events or adapters.'
          }
        ]
      }
    ],
    
    // Enforce that services only import from their domain
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/services/energyEngineService.ts',
            from: './src/services/gamificationService.ts',
            message: 'Energy engine should not import from gamification. Use events for communication.'
          },
          {
            target: './src/services/taskSchedulingService.ts',
            from: './src/services/scriptsService.ts',
            message: 'Task scheduling should not import from scripts. Use events for communication.'
          }
        ]
      }
    ],
    
    // Enforce that routes only import from services, not other routes
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/routes/*.ts',
            from: './src/routes/*.ts',
            except: ['./src/routes/index.ts'],
            message: 'Routes should not import from other routes directly. Use shared services or middleware.'
          }
        ]
      }
    ],
    
    // Enforce that services don't import from routes
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './src/services/*.ts',
            from: './src/routes/*.ts',
            message: 'Services should not import from routes. Routes should import from services.'
          }
        ]
      }
    ]
  }
}
