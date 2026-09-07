import { glassTide, type Storyworld } from './domain'

const KEY = 'lumenarchive-glass-tide'
export interface StoryworldRepository { read(): Storyworld; write(world: Storyworld): void; reset(): void }
export const localStoryworldRepository: StoryworldRepository = {
  read() { if (typeof window === 'undefined') return glassTide; try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Storyworld : glassTide } catch { return glassTide } },
  write(world) { if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(world)) },
  reset() { if (typeof window !== 'undefined') window.localStorage.removeItem(KEY) },
}

export interface AIProvider { suggest(input: { prompt: string; storyworldVersion: string; constraints: string[] }): Promise<{ text: string; uncertainty: string; humanReviewRequired: true }> }
export interface MediaProvider { generate(): Promise<{ status: 'not-connected'; message: string }> }
export interface PublishingProvider { publish(): Promise<{ status: 'not-connected'; message: string }> }
