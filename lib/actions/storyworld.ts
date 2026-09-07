/**
 * Storyworld Management Actions
 * 
 * Handle creation, listing, and state management of storyworlds
 */

import { v4 as uuidv4 } from 'uuid'
import { Storyworld, Character, Location, StoryEvent, Rule } from '../domain/types'
import { StoryworldCreateSchema } from '../domain/schemas'
import { getRepository } from '../domain/repository'
import { startSpan, tracer } from '../telemetry/tracer'
import { logEntityCreate, logError } from '../telemetry/pcmf-logger'

interface CreateStoryworldInput {
  title: string
  description?: string
  creator_id: string
  owner_id: string
  tags?: string[]
  accessibility_notes?: string
}

interface CreateStoryworldResult {
  ok: boolean
  storyworld_id?: string
  storyworld?: Storyworld
  error?: string
}

/**
 * Create a new storyworld
 */
export async function createStoryworld(input: CreateStoryworldInput): Promise<CreateStoryworldResult> {
  return startSpan('storyworld.create', async (span) => {
    try {
      span.setAttributes({
        creator_id: input.creator_id,
        title: input.title,
      })

      // Validate input
      const validation = StoryworldCreateSchema.safeParse({
        title: input.title,
        description: input.description,
        creator_id: input.creator_id,
        tags: input.tags || [],
        accessibility_notes: input.accessibility_notes,
        owner_id: input.owner_id,
      })

      if (!validation.success) {
        const error = `Validation failed: ${validation.error.message}`
        span.recordException(new Error(error))
        logError({
          actor_id: input.creator_id,
          action: 'storyworld.create',
          error: error,
        })
        return { ok: false, error }
      }

      // Create storyworld entity
      const now = new Date()
      const storyworld: Storyworld = {
        id: uuidv4(),
        title: input.title,
        description: input.description || '',
        creator_id: input.creator_id,
        owner_id: input.owner_id,
        version: 1,
        status: 'draft',
        tags: input.tags || [],
        accessibility_notes: input.accessibility_notes,
        created_at: now,
        updated_at: now,
      }

      // Persist to repository
      const repo = getRepository()
      const key = `storyworld:${storyworld.id}`
      await repo.write(key, storyworld)

      span.setAttributes({
        storyworld_id: storyworld.id,
        status: storyworld.status,
      })

      // Log to telemetry
      logEntityCreate({
        actor_id: input.creator_id,
        entity_id: storyworld.id,
        entity_type: 'storyworld',
        entity_title: storyworld.title,
        reason: 'New storyworld created',
      })

      return { ok: true, storyworld_id: storyworld.id, storyworld }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: input.creator_id,
        action: 'storyworld.create',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * List all storyworlds for a creator
 */
export async function listStoryworlds(creator_id: string): Promise<Storyworld[]> {
  return startSpan('storyworld.list', async (span) => {
    try {
      const repo = getRepository()
      const results = await repo.query<Storyworld>('storyworld', (sw) => sw.creator_id === creator_id)
      
      span.setAttributes({
        creator_id,
        count: results.length,
      })

      return results.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return []
    }
  })
}

/**
 * Get a single storyworld by ID
 */
export async function getStoryworld(storyworld_id: string): Promise<Storyworld | null> {
  return startSpan('storyworld.get', async (span) => {
    try {
      const repo = getRepository()
      const key = `storyworld:${storyworld_id}`
      const storyworld = await repo.read<Storyworld>(key)

      span.setAttributes({
        storyworld_id,
        found: !!storyworld,
      })

      return storyworld
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  })
}

/**
 * Get storyworld overview (counts of entities)
 */
export async function getStoryworldOverview(storyworld_id: string): Promise<{
  storyworld: Storyworld | null
  character_count: number
  location_count: number
  event_count: number
  rule_count: number
} | null> {
  return startSpan('storyworld.overview', async (span) => {
    try {
      const repo = getRepository()
      const storyworld = await repo.read<Storyworld>(`storyworld:${storyworld_id}`)

      if (!storyworld) {
        return null
      }

      const [characters, locations, events, rules] = await Promise.all([
        repo.query<Character>('character', (c) => c.storyworld_id === storyworld_id),
        repo.query<Location>('location', (l) => l.storyworld_id === storyworld_id),
        repo.query<StoryEvent>('event', (e) => e.storyworld_id === storyworld_id),
        repo.query<Rule>('rule', (r) => r.storyworld_id === storyworld_id),
      ])

      span.setAttributes({
        storyworld_id,
        character_count: characters.length,
        location_count: locations.length,
        event_count: events.length,
        rule_count: rules.length,
      })

      return {
        storyworld,
        character_count: characters.length,
        location_count: locations.length,
        event_count: events.length,
        rule_count: rules.length,
      }
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  })
}
