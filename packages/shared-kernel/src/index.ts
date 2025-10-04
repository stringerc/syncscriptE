/**
 * Shared Kernel - Public API
 * 
 * This package contains shared types, utilities, and contracts
 * that can be used across all domains without creating dependencies.
 */

// Event system
export * from './events'

// Common types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface UserContext {
  userId: string
  email: string
  timezone?: string
}

// Common utilities
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Error types
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', { resource, id })
    this.name = 'NotFoundError'
  }
}

// Result type for operations that can fail
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export function success<T>(data: T): Result<T, never> {
  return { success: true, data }
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error }
}
