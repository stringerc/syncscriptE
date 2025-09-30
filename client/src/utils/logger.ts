/**
 * Production-safe logging utility
 * Automatically disabled in production builds
 */

const IS_DEVELOPMENT = import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEVELOPMENT) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args)
  },
  
  warn: (...args: any[]) => {
    if (IS_DEVELOPMENT) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (IS_DEVELOPMENT) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (IS_DEVELOPMENT) {
      console.log(...args)
    }
  }
}

// Shorthand for common patterns
export const devLog = (emoji: string, ...args: any[]) => {
  if (IS_DEVELOPMENT) {
    console.log(emoji, ...args)
  }
}
