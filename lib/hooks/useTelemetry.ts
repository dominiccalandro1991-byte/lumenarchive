/**
 * React Hook: useTelemetry
 * 
 * Provides access to telemetry utilities within components
 */

import { useCallback, useRef } from 'react'
import { startSpan, recordAttribute, recordException } from '../telemetry/tracer'

export function useTelemetry() {
  const activeSpanName = useRef<string | null>(null)

  const withTelemetry = useCallback(
    async <T,>(
      name: string,
      fn: () => Promise<T>,
      attributes?: Record<string, any>
    ): Promise<T> => {
      return startSpan(name, async (span) => {
        activeSpanName.current = name
        if (attributes) {
          span.setAttributes(attributes)
        }
        try {
          const result = await fn()
          return result
        } finally {
          activeSpanName.current = null
        }
      })
    },
    []
  )

  const logAttribute = useCallback((key: string, value: any) => {
    recordAttribute(key, value)
  }, [])

  const logException = useCallback((error: Error | string) => {
    recordException(error)
  }, [])

  return {
    withTelemetry,
    logAttribute,
    logException,
    activeSpanName: activeSpanName.current,
  }
}
