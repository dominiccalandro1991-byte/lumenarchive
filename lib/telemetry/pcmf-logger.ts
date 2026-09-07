/**
 * PCMF (Proof-Carrying Metadata Framework) Logger
 * 
 * Structured event logging for audit trail and compliance:
 * - Who performed the action
 * - What entity was affected
 * - When and where it happened
 * - Why (reason/evidence)
 * - Before/after state for all changes
 * 
 * Events are stored locally and can be exported as JSON-L
 */

import { ActivityEvent } from '../domain/types'
import { getRepository } from '../domain/repository'
import { v4 as uuidv4 } from 'uuid'

export interface PCMFLogEntry {
  id: string
  timestamp: Date
  actor_id: string
  actor_name?: string
  action: string // 'create', 'update', 'approve', 'reject', 'apply_change', etc.
  entity_id: string
  entity_type: string
  entity_title?: string
  changes: Array<{
    field: string
    before: any
    after: any
  }>
  reason?: string // Why was this action taken?
  evidence?: string // Supporting evidence or link to change request
  metadata?: {
    ip_address?: string
    user_agent?: string
    duration_ms?: number // How long the operation took
    tags?: string[] // For filtering/analysis
  }
  status: 'success' | 'failure'
  error_message?: string
}

/**
 * Global PCMF event log (in-memory + persisted)
 */
class PCMFLogger {
  private events: PCMFLogEntry[] = []
  private maxEvents = 10000 // Keep last 10k events in memory

  /**
   * Log a structured event
   */
  log(entry: Omit<PCMFLogEntry, 'id' | 'timestamp'>): PCMFLogEntry {
    const fullEntry: PCMFLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry,
    }

    // Add to in-memory log
    this.events.push(fullEntry)
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Persist to repository
    this.persist(fullEntry)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[PCMF] ${entry.action} on ${entry.entity_type}:${entry.entity_id} by ${entry.actor_id}`,
        fullEntry
      )
    }

    return fullEntry
  }

  /**
   * Persist event to repository
   */
  private async persist(entry: PCMFLogEntry): Promise<void> {
    try {
      const repo = getRepository()
      const key = `activity:${entry.id}`
      await repo.write(key, entry)
    } catch (error) {
      console.error('[PCMF] Failed to persist event:', error)
    }
  }

  /**
   * Get recent events (in-memory)
   */
  getRecent(limit = 100): PCMFLogEntry[] {
    return this.events.slice(-limit)
  }

  /**
   * Filter events by criteria
   */
  filter(predicate: (entry: PCMFLogEntry) => boolean): PCMFLogEntry[] {
    return this.events.filter(predicate)
  }

  /**
   * Export all events as JSON-L (one event per line)
   */
  exportJsonL(): string {
    return this.events.map(e => JSON.stringify(e)).join('\n')
  }

  /**
   * Clear in-memory log (does not delete from repository)
   */
  clear(): void {
    this.events = []
  }
}

// Singleton instance
const pcmfLogger = new PCMFLogger()

/**
 * High-level action logging (entity creation)
 */
export function logEntityCreate(input: {
  actor_id: string
  entity_id: string
  entity_type: string
  entity_title?: string
  reason?: string
  metadata?: Record<string, any>
}): PCMFLogEntry {
  return pcmfLogger.log({
    actor_id: input.actor_id,
    action: 'create',
    entity_id: input.entity_id,
    entity_type: input.entity_type,
    entity_title: input.entity_title,
    changes: [],
    reason: input.reason,
    metadata: input.metadata,
    status: 'success',
  })
}

/**
 * High-level action logging (entity update)
 */
export function logEntityUpdate(input: {
  actor_id: string
  entity_id: string
  entity_type: string
  entity_title?: string
  changes: Array<{ field: string; before: any; after: any }>
  reason?: string
  metadata?: Record<string, any>
}): PCMFLogEntry {
  return pcmfLogger.log({
    actor_id: input.actor_id,
    action: 'update',
    entity_id: input.entity_id,
    entity_type: input.entity_type,
    entity_title: input.entity_title,
    changes: input.changes,
    reason: input.reason,
    metadata: input.metadata,
    status: 'success',
  })
}

/**
 * High-level action logging (change request approval)
 */
export function logChangeApproval(input: {
  actor_id: string
  change_request_id: string
  entity_id: string
  entity_type: string
  decision: 'approve' | 'reject'
  feedback?: string
  metadata?: Record<string, any>
}): PCMFLogEntry {
  return pcmfLogger.log({
    actor_id: input.actor_id,
    action: `change_${input.decision}`,
    entity_id: input.entity_id,
    entity_type: input.entity_type,
    changes: [],
    reason: input.feedback,
    metadata: {
      ...input.metadata,
      change_request_id: input.change_request_id,
    },
    status: 'success',
  })
}

/**
 * High-level action logging (release proposal)
 */
export function logReleaseAction(input: {
  actor_id: string
  release_id: string
  storyworld_id: string
  action: 'propose' | 'approve' | 'publish'
  reason?: string
  metadata?: Record<string, any>
}): PCMFLogEntry {
  return pcmfLogger.log({
    actor_id: input.actor_id,
    action: `release_${input.action}`,
    entity_id: input.release_id,
    entity_type: 'release_record',
    changes: [],
    reason: input.reason,
    metadata: {
      ...input.metadata,
      storyworld_id: input.storyworld_id,
    },
    status: 'success',
  })
}

/**
 * High-level action logging (error/failure)
 */
export function logError(input: {
  actor_id: string
  action: string
  entity_id?: string
  entity_type?: string
  error: Error | string
  metadata?: Record<string, any>
}): PCMFLogEntry {
  const message = input.error instanceof Error ? input.error.message : String(input.error)
  return pcmfLogger.log({
    actor_id: input.actor_id,
    action: input.action,
    entity_id: input.entity_id || 'unknown',
    entity_type: input.entity_type || 'unknown',
    changes: [],
    metadata: input.metadata,
    status: 'failure',
    error_message: message,
  })
}

/**
 * Get the global logger instance
 */
export function getPCMFLogger() {
  return pcmfLogger
}
