/**
 * Domain Business Logic Validators
 * 
 * These validators enforce storyworld rules:
 * - Continuity checks (event consistency, character conflicts)
 * - Release gate validation (approval requirements)
 * - Change request impact analysis
 */

import { Rule, StoryEvent, Character, Location, ContinuityIssue, ReleaseGate, ChangeRequest, ReleaseRecord } from './types'

export interface ContinuityCheckResult {
  passed: boolean
  issues: ContinuityIssue[]
  timestamp: Date
}

export interface ReleaseGateCheckResult {
  ok: boolean
  blockers: ReleaseGate[]
  details: Record<ReleaseGate, { passed: boolean; reason?: string }>
}

/**
 * Validates continuity rules across events, characters, and locations
 * Returns detected continuity issues
 */
export function validateContinuity(input: {
  rules: Rule[]
  events: StoryEvent[]
  characters: Character[]
  locations: Location[]
}): ContinuityIssue[] {
  const { rules, events, characters, locations } = input
  const issues: ContinuityIssue[] = []

  // Check 1: Event temporal consistency
  for (let i = 0; i < events.length; i++) {
    const evt = events[i]
    if (!evt.timestamp) continue

    for (const triggerId of evt.triggers) {
      const trigger = events.find(e => e.id === triggerId)
      if (trigger?.timestamp && trigger.timestamp >= evt.timestamp) {
        issues.push({
          id: `continuity-${evt.id}-${triggerId}`,
          storyworld_id: evt.storyworld_id,
          title: `Temporal inconsistency: ${trigger.title} occurs after ${evt.title}`,
          description: `Event "${trigger.title}" (${trigger.timestamp.toISOString()}) must occur before "${evt.title}" (${evt.timestamp.toISOString()})`,
          severity: 'high',
          affected_entities: [
            { entity_id: evt.id, entity_type: 'event' },
            { entity_id: triggerId, entity_type: 'event' },
          ],
          related_rule: undefined,
          resolution_proposed: undefined,
          resolved: false,
          status: 'draft',
          owner_id: evt.owner_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
  }

  // Check 2: Character existence in events
  const characterIds = new Set(characters.map(c => c.id))
  for (const evt of events) {
    for (const participantId of evt.participants) {
      if (!characterIds.has(participantId)) {
        issues.push({
          id: `continuity-${evt.id}-char-missing`,
          storyworld_id: evt.storyworld_id,
          title: `Missing character reference`,
          description: `Event "${evt.title}" references character ${participantId}, which does not exist`,
          severity: 'critical',
          affected_entities: [{ entity_id: evt.id, entity_type: 'event' }],
          related_rule: undefined,
          resolution_proposed: undefined,
          resolved: false,
          status: 'draft',
          owner_id: evt.owner_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
  }

  // Check 3: Location existence in events
  const locationIds = new Set(locations.map(l => l.id))
  for (const evt of events) {
    for (const locId of evt.location_ids) {
      if (!locationIds.has(locId)) {
        issues.push({
          id: `continuity-${evt.id}-loc-missing`,
          storyworld_id: evt.storyworld_id,
          title: `Missing location reference`,
          description: `Event "${evt.title}" references location ${locId}, which does not exist`,
          severity: 'critical',
          affected_entities: [{ entity_id: evt.id, entity_type: 'event' }],
          related_rule: undefined,
          resolution_proposed: undefined,
          resolved: false,
          status: 'draft',
          owner_id: evt.owner_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
  }

  // Check 4: Rule violations (basic structure)
  for (const rule of rules) {
    if (rule.enforcement_level === 'strict' && rule.applies_to.includes('event')) {
      // Strict rules on events: check that rule exceptions are honored
      // This is domain-specific and would need rule definition language
    }
  }

  return issues
}

/**
 * Checks if a release meets all approval gates
 */
export function checkReleaseGates(input: {
  pendingChangeRequests: ChangeRequest[]
  continuityIssues: ContinuityIssue[]
  rightsApproved: boolean
  consentApproved: boolean
  accessibilityChecked: boolean
}): ReleaseGateCheckResult {
  const { pendingChangeRequests, continuityIssues, rightsApproved, consentApproved, accessibilityChecked } = input

  const blockers: ReleaseGate[] = []
  const details: Record<ReleaseGate, { passed: boolean; reason?: string }> = {
    continuity: { passed: continuityIssues.length === 0, reason: `${continuityIssues.length} issues detected` },
    rights: { passed: rightsApproved, reason: 'Rights not yet approved' },
    consent: { passed: consentApproved, reason: 'Consent not yet obtained' },
    accessibility: { passed: accessibilityChecked, reason: 'Accessibility not checked' },
    approvals: { passed: pendingChangeRequests.length === 0, reason: `${pendingChangeRequests.length} pending approvals` },
  }

  if (!details.continuity.passed) blockers.push('continuity')
  if (!details.rights.passed) blockers.push('rights')
  if (!details.consent.passed) blockers.push('consent')
  if (!details.accessibility.passed) blockers.push('accessibility')
  if (!details.approvals.passed) blockers.push('approvals')

  return {
    ok: blockers.length === 0,
    blockers,
    details,
  }
}

/**
 * Analyzes impact of a proposed change on related entities
 */
export function analyzeChangeImpact(input: {
  changeRequest: ChangeRequest
  relatedEntities: any[]
  rules: Rule[]
}): {
  impactedCount: number
  potentialConflicts: string[]
  requiresApproval: boolean
} {
  const { changeRequest, relatedEntities, rules } = input

  const potentialConflicts: string[] = []
  let impactedCount = relatedEntities.length

  // Check if change violates any strict rules
  const strictRules = rules.filter(r => r.enforcement_level === 'strict' && r.applies_to.includes(changeRequest.entity_type))
  if (strictRules.length > 0) {
    potentialConflicts.push(`Change may violate ${strictRules.length} strict rule(s)`)
  }

  return {
    impactedCount,
    potentialConflicts,
    requiresApproval: changeRequest.review_status === 'pending',
  }
}
