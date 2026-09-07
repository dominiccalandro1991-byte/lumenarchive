'use client'

import { useState, useEffect } from 'react'
import { listCharacters, createCharacter } from '@/lib/actions/character'
import { Character } from '@/lib/domain/types'
import { useParams } from 'next/navigation'

export default function StudioWorldPage() {
  const params = useParams()
  const worldId = params.worldId as string

  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
  })
  const [creating, setCreating] = useState(false)

  const userId = 'current-user-id' // TODO: get from auth

  useEffect(() => {
    loadCharacters()
  }, [worldId])

  const loadCharacters = async () => {
    setLoading(true)
    const chars = await listCharacters(worldId)
    setCharacters(chars)
    setLoading(false)
  }

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    const result = await createCharacter({
      storyworld_id: worldId,
      name: formData.name,
      role: formData.role,
      description: formData.description,
      owner_id: userId,
      actor_id: userId,
    })

    if (result.ok && result.character) {
      setCharacters([...characters, result.character])
      setFormData({ name: '', role: '', description: '' })
      setShowCreateModal(false)
    }

    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Characters</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="touch-target px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            + Add Character
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No characters yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="touch-target px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Create First Character
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((char) => (
              <div
                key={char.id}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 touch-target hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{char.name}</h3>
                    <p className="text-sm text-slate-400">{char.role}</p>
                    <p className="text-sm text-slate-300 mt-2 line-clamp-2">{char.description}</p>
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-600/30 text-blue-300 rounded">
                    {char.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Character</h2>
            <form onSubmit={handleCreateCharacter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Character name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Protagonist, Antagonist"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="Character description..."
                  required
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
                  disabled={creating || !formData.name || !formData.role || !formData.description}
                  className="touch-target flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
