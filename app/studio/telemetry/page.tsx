'use client'

import { useState, useEffect } from 'react'
import { getPCMFLogger } from '@/lib/telemetry/pcmf-logger'
import { PCMFLogEntry } from '@/lib/telemetry/pcmf-logger'

export default function TelemetryDashboard() {
  const [events, setEvents] = useState<PCMFLogEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const logger = getPCMFLogger()
    const all = logger.getRecent(100)
    setEvents(all)

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      setEvents(logger.getRecent(100))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    if (filter === 'success') return e.status === 'success'
    if (filter === 'failure') return e.status === 'failure'
    return e.action === filter
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const logger = getPCMFLogger()
      const jsonl = logger.exportJsonL()
      const blob = new Blob([jsonl], { type: 'application/jsonlines' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lumenarchive-telemetry-${new Date().toISOString()}.jsonl`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const successCount = events.filter(e => e.status === 'success').length
  const failureCount = events.filter(e => e.status === 'failure').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Telemetry Dashboard</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-blue-600 text-white rounded touch-target disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export PCMF Logs'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
          <div className="text-3xl font-bold">{events.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400">Success</div>
          <div className="text-3xl font-bold text-green-600">{successCount}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-700 dark:text-red-400">Failures</div>
          <div className="text-3xl font-bold text-red-600">{failureCount}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'success', 'failure', 'create', 'update', 'change_approve', 'release_propose'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded whitespace-nowrap touch-target ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-100 dark:bg-gray-800">
              <th className="text-left p-3">Timestamp</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Entity</th>
              <th className="text-left p-3">Actor</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-3 text-xs">
                  {event.timestamp.toLocaleTimeString()}
                </td>
                <td className="p-3 font-mono text-xs">{event.action}</td>
                <td className="p-3 text-xs">
                  {event.entity_type}:{event.entity_id.slice(0, 8)}
                </td>
                <td className="p-3 text-xs">{event.actor_id.slice(0, 8)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-600 dark:text-gray-400">
                  {event.reason || event.error_message || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No events recorded yet</p>
        </div>
      )}
    </div>
  )
}
