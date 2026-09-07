/**
 * Continuity Validation Actions
 * 
 * Check for continuity issues and generate reports
 */

import { Character, Location, StoryEvent, Rule, ContinuityIssue } from '../domain/types'
import { getRepository } from '../domain/repository'
import { validateContinuity as validateContinuityRules } from '../domain/validators'
import { startSpan } from '../telemetry/tracer'
import { recordAttribute, tracer } from '../telemetry/tracer'

export interface ContinuityReport {
  storyworld_id: string
  timestamp: Date
  issues: ContinuityIssue[]
  passed: boolean
  issue_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
}

/**
 * Validate continuity for a storyworld
 */
export async function validateContinuity(storyworld_id: string): Promise<ContinuityReport> {
  return startSpan('continuity.validate', async (span) => {
    try {
      const repo = getRepository()

      // Fetch all related entities in parallel
      const [rules, events, characters, locations] = await Promise.all([
        repo.query<Rule>('rule', (r) => r.storyworld_id === storyworld_id),
        repo.query<StoryEvent>('event', (e) => e.storyworld_id === storyworld_id),
        repo.query<Character>('character', (c) => c.storyworld_id === storyworld_id),
        repo.query<Location>('location', (l) => l.storyworld_id === storyworld_id),
      ])

      // Run validator
      const issues = validateContinuityRules({ rules, events, characters, locations })

      // Count severity levels
      const counts = {
        critical: issues.filter((i) => i.severity === 'critical').length,
        high: issues.filter((i) => i.severity === 'high').length,
        medium: issues.filter((i) => i.severity === 'medium').length,
        low: issues.filter((i) => i.severity === 'low').length,
      }

      const report: ContinuityReport = {
        storyworld_id,
        timestamp: new Date(),
        issues,
        passed: issues.length === 0,
        issue_count: issues.length,
        critical_count: counts.critical,
        high_count: counts.high,
        medium_count: counts.medium,
        low_count: counts.low,
      }

      span.setAttributes({
        storyworld_id,
        issue_count: issues.length,
        passed: report.passed,
        critical_count: counts.critical,
      })

      return report
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return {
        storyworld_id,
        timestamp: new Date(),
        issues: [],
        passed: false,
        issue_count: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
      }
    }
  })
}

/**
 * Get all continuity issues for a storyworld
 */
export async function listContinuityIssues(storyworld_id: string): Promise<ContinuityIssue[]> {
  return startSpan('continuity.list_issues', async (span) => {
    try {
      const repo = getRepository()
      const results = await repo.query<ContinuityIssue>(
        'continuity_issue',
        (i) => i.storyworld_id === storyworld_id && !i.resolved
      )

      span.setAttributes({
        storyworld_id,
        count: results.length,
      })

      return results.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity as keyof typeof severityOrder] -
          severityOrder[b.severity as keyof typeof severityOrder]
      })
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return []
    }
  })
}
