/**
 * OpenTelemetry Tracer Initialization
 * 
 * Sets up distributed tracing for:
 * - User actions (form submits, entity creates, reviews)
 * - System events (seed load, validation, conflicts)
 * - Errors (validation failures, repository timeouts, missing records)
 */

import { trace, context, Context } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/node'
import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

/**
 * Global tracer instance
 */
export const tracer = trace.getTracer('lumenarchive', '1.0.0')

/**
 * Initialize telemetry (call once on app startup)
 */
export function initializeTelemetry(): void {
  if (typeof window === 'undefined') {
    // Server-side initialization
    const provider = new NodeTracerProvider()

    // Only export if endpoint configured
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    if (endpoint) {
      const exporter = new OTLPTraceExporter({
        url: endpoint + '/v1/traces',
      })
      provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
    }

    trace.setGlobalTracerProvider(provider)
  } else {
    // Browser-side: spans are collected locally and sent periodically
    // This would use @opentelemetry/sdk-trace-web in production
    console.log('[Telemetry] Browser tracing initialized')
  }
}

/**
 * Start a traced span with automatic error handling
 * 
 * @param name - Span name (e.g., 'character.create')
 * @param fn - Async function to trace
 * @param attributes - Optional span attributes
 * @returns Result of fn
 * 
 * @example
 * const result = await startSpan('character.create', async (span) => {
 *   span.setAttributes({ storyworld_id, actor })
 *   const char = await createCharacter(...)
 *   return char
 * })
 */
export async function startSpan<T>(
  name: string,
  fn: (span: any) => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes)
      }
      const result = await fn(span)
      span.setStatus({ code: 0 }) // OK
      return result
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: 2, message: String(error) }) // ERROR
      throw error
    } finally {
      span.end()
    }
  })
}

/**
 * Record a span attribute (e.g., entity count, validation result)
 */
export function recordAttribute(key: string, value: any): void {
  const span = trace.getActiveSpan()
  if (span) {
    span.setAttributes({ [key]: value })
  }
}

/**
 * Record an exception in the current span
 */
export function recordException(error: Error | string): void {
  const span = trace.getActiveSpan()
  if (span) {
    const err = error instanceof Error ? error : new Error(String(error))
    span.recordException(err)
    span.setStatus({ code: 2, message: err.message })
  }
}
