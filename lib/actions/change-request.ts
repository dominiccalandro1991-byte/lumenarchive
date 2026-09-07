/**
 * Change Request Management Actions
 * 
 * Handle canon change proposals, reviews, and approvals
 */

import { v4 as uuidv4 } from 'uuid'
import { ChangeRequest, EntityType } from '../domain/types'
import { ChangeRequestCreateSchema } from '../domain/schemas'
import { getRepository } from '../domain/repository'
import { startSpan } from '../telemetry/tracer'
import { logEntityCreate, logChangeApproval, logError } from '../telemetry/pcmf-logger'

interface ProposeChangeInput {
  storyworld_id: string
  entity_id: string
  entity_type: EntityType
  current_value: any
  proposed_value: any
  reason: string
  evidence?: string
  actor_id: string
  owner_id: string
  conflict_impact?: string
}

interface ProposeChangeResult {
  ok: boolean
  change_request_id?: string
  change_request?: ChangeRequest
  error?: string
}

/**
 * Propose a change to canon
 */
export async function proposeChange(input: ProposeChangeInput): Promise<ProposeChangeResult> {
  return startSpan('change_request.propose', async (span) => {
    try {
      span.setAttributes({
        storyworld_id: input.storyworld_id,
        entity_type: input.entity_type,
        actor_id: input.actor_id,
      })

      // Validate input
      const validation = ChangeRequestCreateSchema.safeParse({
        storyworld_id: input.storyworld_id,
        entity_id: input.entity_id,
        entity_type: input.entity_type,
        current_value: input.current_value,
        proposed_value: input.proposed_value,
        reason: input.reason,
        evidence: input.evidence,
        actor_id: input.actor_id,
        conflict_impact: input.conflict_impact,
        owner_id: input.owner_id,
      })

      if (!validation.success) {
        const error = `Validation failed: ${validation.error.message}`
        span.recordException(new Error(error))
        logError({
          actor_id: input.actor_id,
          action: 'change_request.propose',
          entity_type: input.entity_type,
          error,
        })
        return { ok: false, error }
      }

      // Create change request
      const now = new Date()
      const changeRequest: ChangeRequest = {
        id: uuidv4(),
        storyworld_id: input.storyworld_id,
        entity_id: input.entity_id,
        entity_type: input.entity_type,
        current_value: input.current_value,
        proposed_value: input.proposed_value,
        reason: input.reason,
        evidence: input.evidence,
        actor_id: input.actor_id,
        review_status: 'pending',
        conflict_impact: input.conflict_impact,
        status: 'pending',
        owner_id: input.owner_id,
        created_at: now,
        updated_at: now,
      }

      // Persist to repository
      const repo = getRepository()
      const key = `change_request:${changeRequest.id}`
      await repo.write(key, changeRequest)

      span.setAttributes({
        change_request_id: changeRequest.id,
        review_status: changeRequest.review_status,
      })

      // Log to telemetry
      logEntityCreate({
        actor_id: input.actor_id,
        entity_id: changeRequest.id,
        entity_type: 'change_request',
        reason: `Change proposed to ${input.entity_type}: ${input.reason}`,
        metadata: {
          storyworld_id: input.storyworld_id,
          target_entity: input.entity_id,
          conflict_impact: input.conflict_impact,
        },
      })

      return { ok: true, change_request_id: changeRequest.id, change_request: changeRequest }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: input.actor_id,
        action: 'change_request.propose',
        entity_type: input.entity_type,
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * Approve or reject a change request
 */
export async function reviewChangeRequest(
  change_request_id: string,
  decision: 'approve' | 'reject',
  reviewer_id: string,
  feedback?: string
): Promise<{ ok: boolean; change_request?: ChangeRequest; error?: string }> {
  return startSpan('change_request.review', async (span) => {
    try {
      const repo = getRepository()
      const key = `change_request:${change_request_id}`
      const current = await repo.read<ChangeRequest>(key)

      if (!current) {
        return { ok: false, error: 'Change request not found' }
      }

      if (current.review_status !== 'pending') {
        return { ok: false, error: 'Change request already reviewed' }
      }

      // Update change request
      const now = new Date()
      const updated: ChangeRequest = {
        ...current,
        review_status: decision,
        reviewer_id,
        feedback,
        reviewed_at: now,
        updated_at: now,
      }

      if (decision === 'approve') {
        updated.applied_at = now
      }

      await repo.write(key, updated)

      span.setAttributes({
        change_request_id,
        decision,
        reviewer_id,
      })

      // Log to telemetry
      logChangeApproval({
        actor_id: reviewer_id,
        change_request_id,
        entity_id: current.entity_id,
        entity_type: current.entity_type,
        decision,
        feedback,
        metadata: {
          storyworld_id: current.storyworld_id,
        },
      })

      return { ok: true, change_request: updated }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: reviewer_id,
        action: 'change_request.review',
        entity_id: change_request_id,
        entity_type: 'change_request',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * List pending change requests for a storyworld
 */
export async function listPendingChanges(storyworld_id: string): Promise<ChangeRequest[]> {
  return startSpan('change_request.list_pending', async (span) => {
    try {
      const repo = getRepository()
      const results = await repo.query<ChangeRequest>(
        'change_request',
        (cr) => cr.storyworld_id === storyworld_id && cr.review_status === 'pending'
      )

      span.setAttributes({
        storyworld_id,
        count: results.length,
      })

      return results.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return []
    }
  })
}
