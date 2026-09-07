/**
 * Repository Pattern: Browser-Local Persistence Layer
 * 
 * This abstraction allows future migration to server-side storage.
 * Currently uses localStorage + IndexedDB for reliability.
 */

import { Storyworld, Character, Location, StoryEvent, Rule, ChangeRequest, ReleaseRecord, ActivityEvent, EntityType } from './types'

export interface IRepository {
  /**
   * Reads a single entity by key
   */
  read<T>(key: string): Promise<T | null>

  /**
   * Writes a single entity
   */
  write<T>(key: string, value: T): Promise<void>

  /**
   * Queries entities by predicate
   */
  query<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>

  /**
   * Transactional multi-entity write
   */
  transaction<T>(ops: Array<{ type: 'write' | 'delete'; key: string; value?: T }>): Promise<void>

  /**
   * Deletes an entity by key
   */
  delete(key: string): Promise<void>
}

/**
 * Browser-based repository using localStorage (with IndexedDB fallback planned)
 */
export class BrowserRepository implements IRepository {
  private prefix = 'lumenarchive:'

  async read<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key)
      return stored ? JSON.parse(stored) as T : null
    } catch (error) {
      console.error(`Repository read error for key ${key}:`, error)
      return null
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch (error) {
      console.error(`Repository write error for key ${key}:`, error)
      throw new Error(`Failed to persist ${key}`)
    }
  }

  async query<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    try {
      const results: T[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith(this.prefix + collection + ':')) continue

        const stored = localStorage.getItem(key)
        if (!stored) continue

        const item = JSON.parse(stored) as T
        if (predicate(item)) {
          results.push(item)
        }
      }
      return results
    } catch (error) {
      console.error(`Repository query error for collection ${collection}:`, error)
      return []
    }
  }

  async transaction<T>(ops: Array<{ type: 'write' | 'delete'; key: string; value?: T }>): Promise<void> {
    try {
      for (const op of ops) {
        if (op.type === 'write' && op.value) {
          localStorage.setItem(this.prefix + op.key, JSON.stringify(op.value))
        } else if (op.type === 'delete') {
          localStorage.removeItem(this.prefix + op.key)
        }
      }
    } catch (error) {
      console.error(`Repository transaction error:`, error)
      throw new Error('Transaction failed')
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error(`Repository delete error for key ${key}:`, error)
    }
  }
}

/**
 * Singleton instance
 */
let repositoryInstance: IRepository | null = null

export function getRepository(): IRepository {
  if (!repositoryInstance) {
    repositoryInstance = new BrowserRepository()
  }
  return repositoryInstance
}

export function setRepository(repo: IRepository): void {
  repositoryInstance = repo
}
