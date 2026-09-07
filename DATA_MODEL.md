# Data Model

Core entities: Storyworld, Character, Location, Object, Event, Theme, Rule, MediaProject, MediaAsset, RightsRecord, ChangeRequest, ContinuityIssue, ReleaseRecord, ActivityEvent, Suggestion.

Every significant record carries id, title/name, status, owner, createdAt, updatedAt, provenance, rights, consent where applicable, accessibility metadata, rating, and approval metadata.

Canon records are immutable from direct UI edits. A ChangeRequest stores entityId, currentValue, proposedValue, reason, evidence, actor, timestamps, review status, approver, and conflict impact.

Seed: Glass Tide storyworld with six characters, five locations, twelve events, eight rules, five media types, rights metadata, intentional continuity blockers, and incomplete release state.
