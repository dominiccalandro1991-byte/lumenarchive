# LumenArchive: Transformation Roadmap & Implementation Plan

## Phase Overview

This document charts the path from the current v0 shell (browser-local demo with seeded data) to a fully functional, production-grade storyworld platform with integrated telemetry, reactive domain logic, and mobile-first UI.

---

## Phase 1: Repository & Schema Scaffolding (Week 1)

### 1.1 Core Domain Types & Validation Schemas

**Files to create:**
- `lib/domain/types.ts` — Core entity types: Storyworld, Character, Location, Event, Rule, MediaProject, RightsRecord, ChangeRequest, ContinuityIssue, ReleaseRecord, ActivityEvent
- `lib/domain/schemas.ts` — Zod schemas for all entities (validation + type extraction)
- `lib/domain/validators.ts` — Business logic validators: continuity rules, release gates, change request approval workflow

**Key symbols:**
```typescript
// types.ts
type Storyworld = { id: string; title: string; status: 'draft' | 'canon' | 'archived'; ... }
type Character = { id: string; name: string; storyworld_id: string; ... }
type ChangeRequest = { id: string; entity_id: string; entity_type: EntityType; ... }

// schemas.ts
const StoryworldSchema = z.object({ ... })
const ChangeRequestSchema = z.object({ ... })

// validators.ts
function validateContinuity(rules: Rule[], events: Event[]): ContinuityIssue[] { ... }
function canApproveRelease(record: ReleaseRecord): { ok: boolean; blockers: string[] } { ... }
```

### 1.2 Repository Layer (Browser + Future Server)

**File:** `lib/repository.ts`
- Interface: `IRepository` with methods: `read(key)`, `write(key, value)`, `query(predicate)`, `transaction(ops)`
- Implementation: `BrowserRepository` (localStorage + IndexedDB fallback)
- Deterministic seeding: `applyDemoSeed()` creates Glass Tide storyworld on first load

**Key symbols:**
```typescript
interface IRepository {
  read<T>(key: string): Promise<T | null>
  write<T>(key: string, value: T): Promise<void>
  query<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>
}

class BrowserRepository implements IRepository { ... }
```

### 1.3 Integration Tests

**File:** `lib/__tests__/repository.test.ts`
- Verify demo seed creates all Glass Tide entities
- Test continuity validator on seeded data (should detect 3 intentional blockers)
- Test change request workflow: create → review → approve → apply

---

## Phase 2: Telemetry & Instrumentation (Week 1–2)

### 2.1 OpenTelemetry Web SDK Setup

**Files:**
- `lib/telemetry/tracer.ts` — Initialize `@opentelemetry/api-trace`; create global trace provider
- `lib/telemetry/spans.ts` — Span utilities: `startSpan(name, attributes)`, `recordException(error)`
- `lib/telemetry/pcmf-logger.ts` — PCMF (Proof-Carrying Metadata Framework) logging: structured event schema

**Key symbols:**
```typescript
export const tracer = trace.getTracer('lumenarchive')

export function startSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attrs?: Record<string, any>
): Promise<T> { ... }

export function pcmfTraceLog(event: {
  type: string
  actor: string
  entity_id: string
  changes: Record<string, [before, after]>
  reason: string
  timestamp: Date
}): void { ... }
```

### 2.2 Event Instrumentation Points

Wrap these operations with telemetry:
- **User actions**: Form submit, create entity, edit field, review change, approve release
- **System events**: Seed load, repository persist, continuity check, conflict detection
- **Errors**: Validation failure, repository timeout, missing record

**Implementation pattern:**
```typescript
// In studio/bible/page.tsx
async function handleCharacterCreate(form: CharacterCreateForm) {
  return startSpan('character.create', async (span) => {
    span.setAttributes({
      storyworld_id: worldId,
      actor: userId,
      char_name: form.name,
    })
    
    const validation = CharacterSchema.safeParse(form)
    if (!validation.success) {
      span.recordException(new ValidationError(...))
      pcmfTraceLog({ type: 'validation_error', ... })
      return { error: validation.error }
    }
    
    const result = await repo.write(...)
    pcmfTraceLog({ type: 'character_created', ... })
    return { ok: true, id: result.id }
  })
}
```

### 2.3 Telemetry Dashboard Page

**File:** `app/studio/telemetry/page.tsx`
- Display: trace summary (span count, latency histogram, error rate)
- Table: recent events (actor, operation, timestamp, result)
- Export: download PCMF logs as JSON-L

---

## Phase 3: Core Domain Workflows (Week 2–3)

### 3.1 Domain Actions (Server-Ready Structure)

**File:** `lib/actions/index.ts` — Barrel export for all actions

#### 3.1.1 Storyworld Management
**File:** `lib/actions/storyworld.ts`

```typescript
export async function createStoryworld(input: {
  title: string
  creator_id: string
  initial_rules?: Rule[]
}): Promise<{ ok: boolean; storyworld_id?: string; error?: string }> {
  return startSpan('storyworld.create', async (span) => {
    // Validate input
    // Persist to repository
    // Log to telemetry
    // Return result
  })
}

export async function listStoryworlds(creator_id: string): Promise<Storyworld[]> {
  return startSpan('storyworld.list', async (span) => {
    // Query repository
    // Return sorted by updated_at desc
  })
}
```

#### 3.1.2 Canon & Change Requests
**File:** `lib/actions/change-request.ts`

```typescript
export async function proposeChange(input: {
  storyworld_id: string
  entity_id: string
  entity_type: EntityType
  current_value: any
  proposed_value: any
  reason: string
  evidence: string
  actor_id: string
}): Promise<ChangeRequest> {
  // Validate: entity exists, proposed value is valid for entity type
  // Check: does proposed value violate any rules?
  // Create ChangeRequest with status: 'pending'
  // Log proposal event
}

export async function reviewChangeRequest(input: {
  change_request_id: string
  reviewer_id: string
  decision: 'approve' | 'reject'
  feedback: string
}): Promise<ChangeRequest> {
  // Set decision, reviewer, feedback
  // If approved: apply change to canon, mark request as 'applied'
  // Log decision event
}

export async function listPendingChanges(storyworld_id: string): Promise<ChangeRequest[]> {
  // Query for status = 'pending' sorted by created_at asc
}
```

#### 3.1.3 Continuity & Release
**File:** `lib/actions/continuity.ts`

```typescript
export async function validateContinuity(storyworld_id: string): Promise<ContinuityReport> {
  return startSpan('continuity.validate', async (span) => {
    const [rules, events, chars, locations] = await Promise.all([
      repo.query('rules', r => r.storyworld_id === storyworld_id),
      repo.query('events', e => e.storyworld_id === storyworld_id),
      repo.query('characters', c => c.storyworld_id === storyworld_id),
      repo.query('locations', l => l.storyworld_id === storyworld_id),
    ])
    
    const issues = continuityValidator.check({ rules, events, chars, locations })
    span.setAttributes({ issue_count: issues.length })
    
    return {
      storyworld_id,
      timestamp: new Date(),
      issues,
      passed: issues.length === 0,
    }
  })
}
```

**File:** `lib/actions/release.ts`

```typescript
export async function proposeRelease(input: {
  storyworld_id: string
  title: string
  release_notes: string
  proposer_id: string
}): Promise<ReleaseRecord> {
  // Validate: no pending change requests
  // Validate: continuity check passed
  // Validate: all rights records approved
  // Create ReleaseRecord with status: 'proposed'
  // Log proposal event
}

export async function approveRelease(input: {
  release_id: string
  approver_id: string
}): Promise<ReleaseRecord> {
  // Update status: 'approved'
  // Snapshot canon to immutable version
  // Log approval event
}

export async function canReleaseNow(storyworld_id: string): Promise<{
  ok: boolean
  blockers: string[] // e.g., "Continuity issues present", "3 unapproved rights records"
}> {
  // Check all release gates
}
```

### 3.2 Component-Level Actions (React Server Actions)

**File:** `app/studio/world/actions.ts`

```typescript
'use server'

export async function createCharacterAction(
  formData: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const actor = await getSessionUser() // TODO: implement auth
  const form = Object.fromEntries(formData)
  
  return createCharacter({
    storyworld_id: form.storyworld_id as string,
    name: form.name as string,
    role: form.role as string,
    actor_id: actor.id,
  })
}
```

---

## Phase 4: Page-Level Implementations (Week 3–4)

### 4.1 Studio Workspace Pages

**File structure:**
```
app/studio/
  layout.tsx        — Studio wrapper, domain nav
  page.tsx          — Dashboard overview
  world/
    layout.tsx      — World-specific wrapper
    page.tsx        — World overview (characters, locations, events)
    characters/
      [id]/page.tsx — Character detail & editor
    locations/
      [id]/page.tsx — Location detail & editor
  bible/page.tsx    — Change request review & approval
  timeline/page.tsx — Event graph & temporal navigation
  continuity/
    page.tsx        — Continuity report & issue tracker
    [id]/page.tsx   — Issue detail & resolution
  rights/page.tsx   — Rights records & consent matrix
  release/
    page.tsx        — Release proposals & approval workflow
    [id]/page.tsx   — Release detail & snapshot
```

### 4.2 Example: Studio World Page

**File:** `app/studio/world/page.tsx`

```typescript
'use client'

import { useQuery } from '@/lib/hooks/useQuery'
import { listCharacters, listLocations, listEvents } from '@/lib/actions'
import { CharacterList } from '@/components/world/character-list'
import { LocationList } from '@/components/world/location-list'
import { EventList } from '@/components/world/event-list'

export default function StudioWorldPage({ params }) {
  const { data: chars, isLoading: charsLoading } = useQuery(
    ['characters', params.worldId],
    () => listCharacters(params.worldId)
  )
  
  const { data: locs, isLoading: locsLoading } = useQuery(
    ['locations', params.worldId],
    () => listLocations(params.worldId)
  )
  
  const { data: events, isLoading: eventsLoading } = useQuery(
    ['events', params.worldId],
    () => listEvents(params.worldId)
  )
  
  if (charsLoading || locsLoading || eventsLoading) {
    return <LoadingSpinner />
  }
  
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Characters ({chars?.length || 0})</h2>
        <CharacterList
          characters={chars || []}
          onCreateClick={() => setShowCharacterModal(true)}
        />
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Locations ({locs?.length || 0})</h2>
        <LocationList locations={locs || []} />
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Events ({events?.length || 0})</h2>
        <EventList events={events || []} />
      </section>
    </div>
  )
}
```

### 4.3 Example: Continuity Page with Issues

**File:** `app/studio/continuity/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { validateContinuity, listContinuityIssues } from '@/lib/actions'
import { ContinuityReport } from '@/components/continuity/report'
import { IssueDetail } from '@/components/continuity/issue-detail'

export default function ContinuityPage({ params }) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const { data: report, isLoading } = useQuery(
    ['continuity', params.worldId],
    () => validateContinuity(params.worldId)
  )
  
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <ContinuityReport
          report={report}
          selectedId={selectedIssueId}
          onSelectIssue={setSelectedIssueId}
        />
      </div>
      
      <div className="lg:col-span-2">
        {selectedIssueId ? (
          <IssueDetail
            issueId={selectedIssueId}
            worldId={params.worldId}
          />
        ) : (
          <div className="text-center text-gray-500">Select an issue to view details</div>
        )}
      </div>
    </div>
  )
}
```

### 4.4 Release Approval Workflow

**File:** `app/studio/release/page.tsx`

```typescript
'use client'

export default function ReleaseStudioPage({ params }) {
  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  
  const handleProposeRelease = async (form: ReleaseProposalForm) => {
    const result = await proposeRelease({
      storyworld_id: params.worldId,
      title: form.title,
      release_notes: form.notes,
      proposer_id: userId, // TODO: auth
    })
    
    if (result.ok) {
      setReleases(prev => [...prev, result.record])
      pcmfTraceLog({
        type: 'release_proposed',
        actor: userId,
        entity_id: result.record.id,
        // ... full metadata
      })
    }
  }
  
  return (
    <div>
      <ReleaseProposalForm onSubmit={handleProposeRelease} />
      <ReleaseList releases={releases} />
    </div>
  )
}
```

---

## Phase 5: Component Library & Mobile Polish (Week 4)

### 5.1 Mobile-Safe Components

**File structure:**
```
components/
  ui/
    button.tsx              — 48px touch target
    input.tsx               — Mobile keyboard handling
    select.tsx              — Bottom sheet on mobile
    modal.tsx               — Full-screen on mobile, centered on desktop
    bottom-sheet.tsx        — Mobile disclosure patterns
  studio/
    character-list.tsx      — Responsive grid or list
    change-request-card.tsx — Touch-friendly card
    timeline-view.tsx       — Touch-scroll with snap
  world/
    character-detail.tsx
    location-detail.tsx
  continuity/
    report.tsx
    issue-detail.tsx
  release/
    approval-modal.tsx
    snapshot-viewer.tsx
```

### 5.2 Mobile-Aware Styling

**File:** `globals.css` (or Tailwind config override)

```css
/* Touch-target sizing */
@layer components {
  .touch-target {
    @apply min-h-12 min-w-12 flex items-center justify-center;
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
}

/* Momentum scrolling for iOS */
.momentum-scroll {
  -webkit-overflow-scrolling: touch;
}

/* Reduce jank on motion-sensitive users */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.3 Responsive Viewport Testing

Run these checks before merging to main:
```bash
# Verify builds
pnpm build

# Type checking
pnpm exec tsc --noEmit

# Manual testing script (document in README)
# - Test on iPhone SE (320px)
# - Test on iPhone 15 (430px)
# - Test on iPad (768px)
# - Test on desktop (1440px)
```

---

## Phase 6: Build & Deployment Verification (End of Week 4)

### 6.1 Pre-Deployment Checklist

- [ ] All domain actions have telemetry instrumentation
- [ ] Repository tests pass (seed load, continuity check, release gates)
- [ ] Pages render without errors at 320px, 430px, 768px, 1440px
- [ ] Forms validate and submit successfully
- [ ] Change request workflow: propose → review → approve → apply
- [ ] Continuity validation detects intentional blockers in Glass Tide seed
- [ ] Release proposal enforces all gates (no pending changes, continuity passed, rights approved)
- [ ] Telemetry dashboard displays recent events
- [ ] PCMF logs export as valid JSON-L

### 6.2 Build Commands

```bash
# Development
pnpm dev

# Type checking
pnpm exec tsc --noEmit

# Build
pnpm build

# Start production server (local)
pnpm start
```

### 6.3 Deployment Notes

- **Environment variables**: (To be defined when connecting real services)
  - `NEXT_PUBLIC_API_BASE_URL` (for future server)
  - `OTEL_EXPORTER_OTLP_ENDPOINT` (for telemetry backend)
  - Any auth provider keys

- **Storage**: Browser IndexedDB initially; prepare migration strategy to cloud DB

- **Performance targets**:
  - First Contentful Paint: < 2s on 4G
  - Largest Contentful Paint: < 3.5s on 4G
  - Cumulative Layout Shift: < 0.1
  - Time to Interactive: < 3.5s on 4G

---

## Summary: Files to Create/Modify

### New files (rough count):
- **Domain**: 4 files (types, schemas, validators, repository)
- **Telemetry**: 3 files (tracer, spans, PCMF logger)
- **Actions**: 6 files (storyworld, character, change-request, continuity, release, + server actions per page)
- **Pages**: 8 files (studio main + 7 domain workspaces)
- **Components**: 15+ files (cards, lists, modals, forms)
- **Utils/Hooks**: 5+ files (useQuery, useForm, telemetry client hooks)
- **Tests**: 3 files (repository, actions, integration)

### Modified files:
- `package.json` — Add OpenTelemetry deps (if needed), testing libs
- `tsconfig.json` — Ensure paths alias works
- `globals.css` — Add mobile-safe utility classes
- `README.md` — Document build, test, deployment steps

---

## Metrics & Success Criteria

| Metric | Target | Rationale |
|--------|--------|-----------|
| Telemetry instrumentation coverage | 100% of domain actions | Every state change auditable |
| Type safety | Zero `any` in domain layer | Catch errors at compile time |
| Mobile viewport coverage | 320px, 430px, 768px, 1440px | Covers 99% of users |
| Continuity validation latency | < 100ms | Real-time user feedback |
| Release proposal latency | < 200ms | Responsive UI |
| Test pass rate | 100% | No regressions |

