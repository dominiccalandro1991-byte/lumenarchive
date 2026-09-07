'use client'

import { useState, useEffect } from 'react'
import { listPendingChanges, reviewChangeRequest } from '@/lib/actions/change-request'
import { ChangeRequest } from '@/lib/domain/types'
import { useParams } from 'next/navigation'

export default function BiblePage() {
  const params = useParams()
  const worldId = params.worldId as string

  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const userId = 'current-user-id' // TODO: get from auth

  useEffect(() => {
    loadChanges()
  }, [worldId])

  const loadChanges = async () => {
    setLoading(true)
    const result = await listPendingChanges(worldId)
    setChanges(result)
    setLoading(false)
  }

  const handleApprove = async (changeId: string) => {
    const result = await reviewChangeRequest(changeId, 'approve', userId, feedback)
    if (result.ok) {
      setChanges(changes.filter((c) => c.id !== changeId))
      setSelectedChangeId(null)
      setFeedback('')
    }
  }

  const handleReject = async (changeId: string) => {
    const result = await reviewChangeRequest(changeId, 'reject', userId, feedback)
    if (result.ok) {
      setChanges(changes.filter((c) => c.id !== changeId))
      setSelectedChangeId(null)
      setFeedback('')
    }
  }

  const selectedChange = changes.find((c) => c.id === selectedChangeId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Canon Review</h1>
        <p className="text-sm text-slate-400 mt-1">{changes.length} pending changes</p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : changes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">All changes approved!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Change List */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {changes.map((change) => (
                  <button
                    key={change.id}
                    onClick={() => setSelectedChangeId(change.id)}
                    className={`touch-target w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedChangeId === change.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <p className="font-medium truncate">{change.entity_type}</p>
                    <p className="text-xs text-slate-400 truncate">{change.reason}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Change Detail */}
            {selectedChange ? (
              <div className="lg:col-span-2 bg-slate-700/50 border border-slate-600 rounded-lg p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">Review Change</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm text-slate-400">Entity Type</label>
                    <p className="font-medium capitalize">{selectedChange.entity_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Reason</label>
                    <p className="font-medium">{selectedChange.reason}</p>
                  </div>
                  {selectedChange.evidence && (
                    <div>
                      <label className="text-sm text-slate-400">Evidence</label>
                      <p className="text-sm">{selectedChange.evidence}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                    <div>
                      <label className="text-sm text-slate-400">Current Value</label>
                      <pre className="text-xs bg-slate-800 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(selectedChange.current_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Proposed Value</label>
                      <pre className="text-xs bg-slate-800 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(selectedChange.proposed_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 block mb-2">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="touch-target w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
                    placeholder="Optional feedback for the proposer..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedChange.id)}
                    className="touch-target flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    disabled={reviewingId === selectedChange.id}
                  >
                    {reviewingId === selectedChange.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedChange.id)}
                    className="touch-target flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    disabled={reviewingId === selectedChange.id}
                  >
                    {reviewingId === selectedChange.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center text-slate-400">
                Select a change to review
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
