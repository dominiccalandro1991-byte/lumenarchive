'use client'

import { useState, useEffect } from 'react'
import { listReleases, proposeRelease, approveRelease, canReleaseNow } from '@/lib/actions/release'
import { ReleaseRecord } from '@/lib/domain/types'
import { useParams } from 'next/navigation'

export default function ReleasePage() {
  const params = useParams()
  const worldId = params.worldId as string

  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [canRelease, setCanRelease] = useState(false)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    version: '0.1.0',
    releaseNotes: '',
  })
  const [proposing, setProposing] = useState(false)

  const userId = 'current-user-id' // TODO: get from auth

  useEffect(() => {
    loadReleases()
  }, [worldId])

  const loadReleases = async () => {
    setLoading(true)
    const [releaseList, canReleaseResult] = await Promise.all([
      listReleases(worldId),
      canReleaseNow(worldId),
    ])
    setReleases(releaseList)
    setCanRelease(canReleaseResult.ok)
    setLoading(false)
  }

  const handleProposeRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    setProposing(true)

    const result = await proposeRelease({
      storyworld_id: worldId,
      title: formData.title,
      version: formData.version,
      release_notes: formData.releaseNotes,
      proposed_by: userId,
      owner_id: userId,
    })

    if (result.ok) {
      setReleases([result.release!, ...releases])
      setFormData({ title: '', version: '0.1.0', releaseNotes: '' })
      setShowProposeModal(false)
      await loadReleases()
    }

    setProposing(false)
  }

  const handleApproveRelease = async (releaseId: string) => {
    const result = await approveRelease(releaseId, userId)
    if (result.ok) {
      setReleases(releases.map((r) => (r.id === releaseId ? result.release! : r)))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Releases</h1>
          <button
            onClick={() => setShowProposeModal(true)}
            disabled={!canRelease}
            className="touch-target px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            + Propose Release
          </button>
        </div>
        {!canRelease && (
          <p className="text-sm text-yellow-400 mt-2">Cannot release: pending changes or continuity issues</p>
        )}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">No releases yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {releases.map((release) => (
              <div
                key={release.id}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 md:p-6 touch-target"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{release.title}</h3>
                    <p className="text-sm text-slate-400">v{release.version}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      release.approval_status === 'approved'
                        ? 'bg-green-600/30 text-green-300'
                        : 'bg-yellow-600/30 text-yellow-300'
                    }`}
                  >
                    {release.approval_status}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mb-3">{release.release_notes}</p>

                {release.blockers.length > 0 && (
                  <div className="mb-3 p-2 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-300">
                    Blocked by: {release.blockers.join(', ')}
                  </div>
                )}

                {release.approval_status === 'pending' && (
                  <button
                    onClick={() => handleApproveRelease(release.id)}
                    className="touch-target px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                  >
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Propose Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Propose Release</h2>
            <form onSubmit={handleProposeRelease} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Release Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., First Beta Release"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.1.0"
                  pattern="\d+\.\d+\.\d+"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Release Notes</label>
                <textarea
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                  className="touch-target w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="What's new in this release?"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="touch-target flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proposing || !formData.title}
                  className="touch-target flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {proposing ? 'Proposing...' : 'Propose'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
