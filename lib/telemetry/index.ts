/**
 * Telemetry Module Exports
 * 
 * Centralized access to:
 * - Distributed tracing (OpenTelemetry)
 * - PCMF structured logging (audit trail)
 * - Telemetry utilities
 */

export { tracer, initializeTelemetry, startSpan, recordAttribute, recordException } from './tracer'
export {
  PCMFLogEntry,
  logEntityCreate,
  logEntityUpdate,
  logChangeApproval,
  logReleaseAction,
  logError,
  getPCMFLogger,
} from './pcmf-logger'
