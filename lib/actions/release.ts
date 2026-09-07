/**
 * Release Record Actions
 * 
 * Handle release proposals, approvals, and publication gates
 */

import { v4 as uuidv4 } from 'uuid'
import { ReleaseRecord } from '../domain/types'
import { ReleaseRecordCreateSchema } from '../domain/schemas'
import { getRepository } from '../domain/repository'
import { checkReleaseGates } from '../domain/validators'
import { startSpan } from '../telemetry/tracer'
import { logReleaseAction, logError } from '../telemetry/pcmf-logger'
import { listPendingChanges } from './change-request'
import { validateContinuity } from './continuity'

interface ProposeReleaseInput {
  storyworld_id: string
  title: string
  version: string
  release_notes: string
  proposed_by: string
  owner_id: string
}

interface ProposeReleaseResult {
  ok: boolean
  release_id?: string
  release?: ReleaseRecord
  error?: string
}

/**
 * Propose a new release
 */
export async function proposeRelease(input: ProposeReleaseInput): Promise<ProposeReleaseResult> {
  return startSpan('release.propose', async (span) => {
    try {
      span.setAttributes({
        storyworld_id: input.storyworld_id,
        version: input.version,
        proposed_by: input.proposed_by,
      })

      // Validate input
      const validation = ReleaseRecordCreateSchema.safeParse({
        storyworld_id: input.storyworld_id,
        title: input.title,
        version: input.version,
        release_notes: input.release_notes,
        proposed_by: input.proposed_by,
        proposal_date: new Date(),
        owner_id: input.owner_id,
      })

      if (!validation.success) {
        const error = `Validation failed: ${validation.error.message}`
        span.recordException(new Error(error))
        logError({
          actor_id: input.proposed_by,
          action: 'release.propose',
          entity_type: 'release_record',
          error,
        })
        return { ok: false, error }
      }

      // Check release gates
      const pendingChanges = await listPendingChanges(input.storyworld_id)
      const continuityReport = await validateContinuity(input.storyworld_id)

      const gateCheck = checkReleaseGates({
        pendingChangeRequests: pendingChanges,
        continuityIssues: continuityReport.issues,
        rightsApproved: true, // TODO: check rights
        consentApproved: true, // TODO: check consent
        accessibilityChecked: true, // TODO: check accessibility
      })

      // Create release record
      const now = new Date()
      const release: ReleaseRecord = {
        id: uuidv4(),
        storyworld_id: input.storyworld_id,
        title: input.title,
        version: input.version,
        release_notes: input.release_notes,
        proposed_by: input.proposed_by,
        proposal_date: now,
        approval_status: 'pending',
        blockers: gateCheck.blockers,
        snapshot: {
          canon_version: 1, // TODO: track actual version
          change_requests_frozen: gateCheck.blockers.includes('approvals'),
          continuity_validated: gateCheck.details.continuity.passed,
          rights_validated: gateCheck.details.rights.passed,
          accessibility_checked: gateCheck.details.accessibility.passed,
        },
        status: 'pending',
        owner_id: input.owner_id,
        created_at: now,
        updated_at: now,
      }

      // Persist to repository
      const repo = getRepository()
      const key = `release_record:${release.id}`
      await repo.write(key, release)

      span.setAttributes({
        release_id: release.id,
        blockers_count: release.blockers.length,
      })

      // Log to telemetry
      logReleaseAction({
        actor_id: input.proposed_by,
        release_id: release.id,
        storyworld_id: input.storyworld_id,
        action: 'propose',
        reason: `Release ${input.version} proposed`,
        metadata: {
          blockers: release.blockers,
        },
      })

      return { ok: true, release_id: release.id, release }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: input.proposed_by,
        action: 'release.propose',
        entity_type: 'release_record',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * Approve a release
 */
export async function approveRelease(
  release_id: string,
  approver_id: string
): Promise<{ ok: boolean; release?: ReleaseRecord; error?: string }> {
  return startSpan('release.approve', async (span) => {
    try {
      const repo = getRepository()
      const key = `release_record:${release_id}`
      const current = await repo.read<ReleaseRecord>(key)

      if (!current) {
        return { ok: false, error: 'Release not found' }
      }

      if (current.approval_status !== 'pending') {
        return { ok: false, error: 'Release already reviewed' }
      }

      // Update release
      const now = new Date()
      const updated: ReleaseRecord = {
        ...current,
        approval_status: 'approved',
        approver_id,
        approval_date: now,
        updated_at: now,
      }

      await repo.write(key, updated)

      span.setAttributes({
        release_id,
        approver_id,
      })

      // Log to telemetry
      logReleaseAction({
        actor_id: approver_id,
        release_id,
        storyworld_id: current.storyworld_id,
        action: 'approve',
        reason: `Release ${current.version} approved`,
      })

      return { ok: true, release: updated }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: approver_id,
        action: 'release.approve',
        entity_id: release_id,
        entity_type: 'release_record',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * Check if a release is ready (all gates pass)
 */
export async function canReleaseNow(
  storyworld_id: string
): Promise<{ ok: boolean; blockers: string[] }> {
  return startSpan('release.can_release_now', async (span) => {
    try {
      const pendingChanges = await listPendingChanges(storyworld_id)
      const continuityReport = await validateContinuity(storyworld_id)

      const gateCheck = checkReleaseGates({
        pendingChangeRequests: pendingChanges,
        continuityIssues: continuityReport.issues,
        rightsApproved: true,
        consentApproved: true,
        accessibilityChecked: true,
      })

      span.setAttributes({
        storyworld_id,
        can_release: gateCheck.ok,
        blockers_count: gateCheck.blockers.length,
      })

      return {
        ok: gateCheck.ok,
        blockers: gateCheck.blockers,
      }
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return { ok: false, blockers: ['error'] }
    }
  })
}

/**
 * List release records for a storyworld
 */
export async function listReleases(storyworld_id: string): Promise<ReleaseRecord[]> {
  return startSpan('release.list', async (span) => {
    try {
      const repo = getRepository()
      const results = await repo.query<ReleaseRecord>(
        'release_record',
        (r) => r.storyworld_id === storyworld_id
      )

      span.setAttributes({
        storyworld_id,
        count: results.length,
      })

      return results.sort((a, b) => b.proposal_date.getTime() - a.proposal_date.getTime())
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return []
    }
  })
}
