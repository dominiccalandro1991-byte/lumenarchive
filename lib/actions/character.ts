/**
 * Character Management Actions
 * 
 * Handle creation, editing, and querying of characters
 */

import { v4 as uuidv4 } from 'uuid'
import { Character, CharacterRelationship } from '../domain/types'
import { CharacterCreateSchema } from '../domain/schemas'
import { getRepository } from '../domain/repository'
import { startSpan } from '../telemetry/tracer'
import { logEntityCreate, logEntityUpdate, logError } from '../telemetry/pcmf-logger'

interface CreateCharacterInput {
  storyworld_id: string
  name: string
  role: string
  description: string
  owner_id: string
  actor_id: string
  relationships?: CharacterRelationship[]
  appearance?: {
    age?: number
    physical_description: string
    distinguishing_features?: string[]
  }
  background?: string
  motivations?: string[]
  arcs?: string[]
}

interface CreateCharacterResult {
  ok: boolean
  character_id?: string
  character?: Character
  error?: string
}

/**
 * Create a new character in a storyworld
 */
export async function createCharacter(input: CreateCharacterInput): Promise<CreateCharacterResult> {
  return startSpan('character.create', async (span) => {
    try {
      span.setAttributes({
        storyworld_id: input.storyworld_id,
        name: input.name,
        actor_id: input.actor_id,
      })

      // Validate input
      const validation = CharacterCreateSchema.safeParse({
        storyworld_id: input.storyworld_id,
        name: input.name,
        role: input.role,
        description: input.description,
        relationships: input.relationships || [],
        appearance: input.appearance,
        background: input.background,
        motivations: input.motivations || [],
        arcs: input.arcs || [],
        owner_id: input.owner_id,
      })

      if (!validation.success) {
        const error = `Validation failed: ${validation.error.message}`
        span.recordException(new Error(error))
        logError({
          actor_id: input.actor_id,
          action: 'character.create',
          entity_type: 'character',
          error,
        })
        return { ok: false, error }
      }

      // Create character entity
      const now = new Date()
      const character: Character = {
        id: uuidv4(),
        storyworld_id: input.storyworld_id,
        name: input.name,
        role: input.role,
        description: input.description,
        status: 'draft',
        owner_id: input.owner_id,
        relationships: input.relationships || [],
        appearance: input.appearance,
        background: input.background,
        motivations: input.motivations || [],
        arcs: input.arcs || [],
        created_at: now,
        updated_at: now,
      }

      // Persist to repository
      const repo = getRepository()
      const key = `character:${character.id}`
      await repo.write(key, character)

      span.setAttributes({
        character_id: character.id,
        status: character.status,
      })

      // Log to telemetry
      logEntityCreate({
        actor_id: input.actor_id,
        entity_id: character.id,
        entity_type: 'character',
        entity_title: character.name,
        reason: 'New character created',
        metadata: {
          storyworld_id: input.storyworld_id,
        },
      })

      return { ok: true, character_id: character.id, character }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id: input.actor_id,
        action: 'character.create',
        entity_type: 'character',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}

/**
 * List all characters in a storyworld
 */
export async function listCharacters(storyworld_id: string): Promise<Character[]> {
  return startSpan('character.list', async (span) => {
    try {
      const repo = getRepository()
      const results = await repo.query<Character>('character', (c) => c.storyworld_id === storyworld_id)

      span.setAttributes({
        storyworld_id,
        count: results.length,
      })

      return results.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return []
    }
  })
}

/**
 * Get a single character by ID
 */
export async function getCharacter(character_id: string): Promise<Character | null> {
  return startSpan('character.get', async (span) => {
    try {
      const repo = getRepository()
      const key = `character:${character_id}`
      const character = await repo.read<Character>(key)

      span.setAttributes({
        character_id,
        found: !!character,
      })

      return character
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  })
}

/**
 * Update a character
 */
export async function updateCharacter(
  character_id: string,
  updates: Partial<Character>,
  actor_id: string
): Promise<{ ok: boolean; character?: Character; error?: string }> {
  return startSpan('character.update', async (span) => {
    try {
      const repo = getRepository()
      const current = await repo.read<Character>(`character:${character_id}`)

      if (!current) {
        return { ok: false, error: 'Character not found' }
      }

      // Track changes for audit trail
      const changes = []
      for (const [key, newValue] of Object.entries(updates)) {
        const oldValue = (current as any)[key]
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field: key,
            before: oldValue,
            after: newValue,
          })
        }
      }

      // Update entity
      const updated: Character = {
        ...current,
        ...updates,
        updated_at: new Date(),
      }

      await repo.write(`character:${character_id}`, updated)

      span.setAttributes({
        character_id,
        changes_count: changes.length,
      })

      // Log update
      logEntityUpdate({
        actor_id,
        entity_id: character_id,
        entity_type: 'character',
        entity_title: updated.name,
        changes,
        metadata: {
          storyworld_id: current.storyworld_id,
        },
      })

      return { ok: true, character: updated }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      span.recordException(error instanceof Error ? error : new Error(message))
      logError({
        actor_id,
        action: 'character.update',
        entity_id: character_id,
        entity_type: 'character',
        error: message,
      })
      return { ok: false, error: message }
    }
  })
}
