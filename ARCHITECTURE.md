# Architecture

## 1. Boundaries
- Presentation: App Router pages and client feature components.
- Domain: strict Storyworld, media, rights, continuity, release, and QA types.
- Repository: browser persistence abstraction with deterministic seed fallback.
- Providers: interfaces only; no external API is represented as connected.

## 2. Data flow
UI -> domain actions/validators -> repository -> browser storage. Protected canon writes become change requests; only approved requests update canon.

## 3. Complexity
- Search/filter: O(N) over bounded local collections.
- Continuity validation: O(R + E + M), where R rules, E events, M media records.
- Repository reads/writes: O(1) key lookup plus serialization cost.

## 4. Reliability
All user-entered forms are validated before state mutation. Missing records render explicit empty/error states. Release gates fail closed.

## 5. Future adapters
`AIProvider`, `MediaProvider`, `StorageProvider`, and `PublishingProvider` remain unimplemented boundaries and must be connected, authenticated, and tested before production claims.
