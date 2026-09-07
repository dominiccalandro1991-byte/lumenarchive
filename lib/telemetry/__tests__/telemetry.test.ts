/**
 * Integration tests for telemetry and PCMF logging
 */

import { logEntityCreate, logEntityUpdate, logChangeApproval, logError, getPCMFLogger } from '../pcmf-logger'
import { v4 as uuidv4 } from 'uuid'

describe('PCMF Logging', () => {
  beforeEach(() => {
    getPCMFLogger().clear()
  })

  it('logs entity creation', () => {
    const actorId = uuidv4()
    const entityId = uuidv4()

    const entry = logEntityCreate({
      actor_id: actorId,
      entity_id: entityId,
      entity_type: 'character',
      entity_title: 'Protagonist',
      reason: 'Initial character creation',
    })

    expect(entry).toBeDefined()
    expect(entry.action).toBe('create')
    expect(entry.entity_type).toBe('character')
    expect(entry.status).toBe('success')
    expect(entry.timestamp).toBeInstanceOf(Date)
  })

  it('logs entity updates with field changes', () => {
    const actorId = uuidv4()
    const entityId = uuidv4()

    const entry = logEntityUpdate({
      actor_id: actorId,
      entity_id: entityId,
      entity_type: 'character',
      entity_title: 'Protagonist',
      changes: [
        { field: 'role', before: 'Ally', after: 'Antagonist' },
        { field: 'status', before: 'draft', after: 'canon' },
      ],
      reason: 'Plot twist revealed',
    })

    expect(entry.action).toBe('update')
    expect(entry.changes).toHaveLength(2)
    expect(entry.changes[0].field).toBe('role')
  })

  it('logs change request approvals', () => {
    const actorId = uuidv4()
    const changeId = uuidv4()
    const entityId = uuidv4()

    const entry = logChangeApproval({
      actor_id: actorId,
      change_request_id: changeId,
      entity_id: entityId,
      entity_type: 'character',
      decision: 'approve',
      feedback: 'Looks good!',
    })

    expect(entry.action).toBe('change_approve')
    expect(entry.metadata?.change_request_id).toBe(changeId)
  })

  it('logs errors with failure status', () => {
    const actorId = uuidv4()

    const entry = logError({
      actor_id: actorId,
      action: 'character.create',
      entity_type: 'character',
      error: new Error('Validation failed'),
    })

    expect(entry.status).toBe('failure')
    expect(entry.error_message).toBe('Validation failed')
  })

  it('retrieves recent events', () => {
    const actorId = uuidv4()

    for (let i = 0; i < 5; i++) {
      logEntityCreate({
        actor_id: actorId,
        entity_id: uuidv4(),
        entity_type: 'character',
      })
    }

    const recent = getPCMFLogger().getRecent(10)
    expect(recent).toHaveLength(5)
  })

  it('filters events by predicate', () => {
    const actorId = uuidv4()
    const otherId = uuidv4()

    logEntityCreate({
      actor_id: actorId,
      entity_id: uuidv4(),
      entity_type: 'character',
    })

    logEntityCreate({
      actor_id: otherId,
      entity_id: uuidv4(),
      entity_type: 'character',
    })

    const filtered = getPCMFLogger().filter(e => e.actor_id === actorId)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].actor_id).toBe(actorId)
  })

  it('exports events as JSON-L', () => {
    logEntityCreate({
      actor_id: uuidv4(),
      entity_id: uuidv4(),
      entity_type: 'character',
    })

    const jsonl = getPCMFLogger().exportJsonL()
    expect(jsonl).toContain('"action":"create"')
    expect(jsonl).toContain('"entity_type":"character"')

    // Parse back to verify JSON-L format
    const lines = jsonl.split('\n')
    expect(lines.length).toBeGreaterThan(0)
    const parsed = JSON.parse(lines[0])
    expect(parsed.action).toBe('create')
  })
})
