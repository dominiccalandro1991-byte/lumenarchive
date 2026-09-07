'use client'

import { useState, useEffect } from 'react'
import { validateContinuity } from '@/lib/actions/continuity'
import { ContinuityReport } from '@/lib/actions/continuity'
import { useParams } from 'next/navigation'

export default function ContinuityPage() {
  const params = useParams()
  const worldId = params.worldId as string

  const [report, setReport] = useState<ContinuityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  useEffect(() => {
    loadContinuityReport()
    const interval = setInterval(() => loadContinuityReport(), 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [worldId])

  const loadContinuityReport = async () => {
    setLoading(true)
    const result = await validateContinuity(worldId)
    setReport(result)
    setLoading(false)
  }

  const selectedIssue = report?.issues.find((i) => i.id === selectedIssueId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Continuity Check</h1>
          <button
            onClick={loadContinuityReport}
            className="touch-target px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {loading && !report ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : report ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Summary Cards */}
            <div
              className={`p-4 rounded-lg border ${
                report.passed
                  ? 'bg-green-900/20 border-green-600 text-green-300'
                  : 'bg-red-900/20 border-red-600 text-red-300'
              }`}
            >
              <div className="text-sm font-medium">Status</div>
              <div className="text-2xl font-bold mt-1">{report.passed ? 'Passed' : 'Issues'}</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400">Total Issues</div>
              <div className="text-2xl font-bold mt-1 text-blue-400">{report.issue_count}</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400">Critical</div>
              <div className="text-2xl font-bold mt-1 text-red-400">{report.critical_count}</div>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400">High</div>
              <div className="text-2xl font-bold mt-1 text-orange-400">{report.high_count}</div>
            </div>
          </div>
        ) : null}

        {report && report.issues.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Issues List */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {report.issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`touch-target w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedIssueId === issue.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate flex-1">{issue.title}</p>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                          issue.severity === 'critical'
                            ? 'bg-red-600/30 text-red-300'
                            : issue.severity === 'high'
                            ? 'bg-orange-600/30 text-orange-300'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-600/30 text-yellow-300'
                            : 'bg-blue-600/30 text-blue-300'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Detail */}
            {selectedIssue ? (
              <div className="lg:col-span-2 bg-slate-700/50 border border-slate-600 rounded-lg p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">{selectedIssue.title}</h2>
                <p className="text-slate-300 mb-4">{selectedIssue.description}</p>

                <div className="space-y-4">
                  {selectedIssue.affected_entities.length > 0 && (
                    <div>
                      <label className="text-sm text-slate-400">Affected Entities</label>
                      <div className="mt-2 space-y-1">
                        {selectedIssue.affected_entities.map((entity, idx) => (
                          <div key={idx} className="text-sm text-slate-300">
                            {entity.entity_type}: {entity.entity_id.slice(0, 8)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedIssue.resolution_proposed && (
                    <div>
                      <label className="text-sm text-slate-400">Proposed Resolution</label>
                      <p className="text-sm text-slate-300 mt-1">{selectedIssue.resolution_proposed}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center text-slate-400">
                Select an issue to view details
              </div>
            )}
          </div>
        ) : report ? (
          <div className="text-center py-12">
            <p className="text-slate-400">✓ No continuity issues detected</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
