'use client'

import { useState, useEffect } from 'react'
import { getStoryworldOverview, listStoryworlds, createStoryworld } from '@/lib/actions/storyworld'
import { Storyworld } from '@/lib/domain/types'
import Link from 'next/link'

export default function StudioPage() {
  const [storyworlds, setStoryworlds] = useState<Storyworld[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [creating, setCreating] = useState(false)

  const userId = 'current-user-id' // TODO: get from auth

  useEffect(() => {
    loadStoryworlds()
  }, [])

  const loadStoryworlds = async () => {
    setLoading(true)
    const worlds = await listStoryworlds(userId)
    setStoryworlds(worlds)
    setLoading(false)
  }

  const handleCreateStoryworld = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    const result = await createStoryworld({
      title: formData.title,
      description: formData.description,
      creator_id: userId,
      owner_id: userId,
    })

    if (result.ok && result.storyworld) {
      setStoryworlds([...storyworlds, result.storyworld])
      setFormData({ title: '', description: '' })
      setShowCreateModal(false)
    }

    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Studio</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="touch-target px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            + New Storyworld
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : storyworlds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No storyworlds yet. Create your first one!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="touch-target px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Create Storyworld
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyworlds.map((world) => (
              <StoryworldCard key={world.id} storyworld={world} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Storyworld</h2>
            <form onSubmit={handleCreateStoryworld} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Glass Tide"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="A story about..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="touch-target flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.title}
                  className="touch-target flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StoryworldCard({ storyworld }: { storyworld: Storyworld }) {
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    const data = await getStoryworldOverview(storyworld.id)
    setOverview(data)
    setLoading(false)
  }

  return (
    <Link href={`/studio/world/${storyworld.id}`}>
      <div className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 md:p-6 touch-target transition-colors cursor-pointer h-full flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1 line-clamp-2">{storyworld.title}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{storyworld.description}</p>
        </div>
        {loading ? (
          <div className="mt-4 text-xs text-slate-500">Loading...</div>
        ) : overview ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{overview.character_count}</div>
              <div className="text-slate-400">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{overview.location_count}</div>
              <div className="text-slate-400">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{overview.event_count}</div>
              <div className="text-slate-400">Events</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{overview.rule_count}</div>
              <div className="text-slate-400">Rules</div>
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
