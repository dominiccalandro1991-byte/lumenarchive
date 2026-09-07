/**
 * Zod Validation Schemas for Domain Types
 * 
 * These schemas enforce validation rules at the boundary:
 * - Input validation before persistence
 * - Type safety with automatic type extraction
 * - Clear error messages for invalid data
 */

import { z } from 'zod'

// Base validation helpers
const dateSchema = z.date().or(z.string().transform(s => new Date(s)))
const uuidSchema = z.string().uuid()
const statusSchema = z.enum(['draft', 'canon', 'archived', 'pending', 'approved', 'rejected'])
const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected'])

// ===== Storyworld =====
export const StoryworldSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title required').max(255),
  description: z.string().max(5000).optional(),
  creator_id: uuidSchema,
  status: statusSchema.default('draft'),
  owner_id: uuidSchema,
  version: z.number().int().nonnegative().default(1),
  tags: z.string().array().default([]),
  accessibility_notes: z.string().max(2000).optional(),
  rating: z.object({
    age_rating: z.string().max(50),
    content_warnings: z.string().array().default([]),
  }).optional(),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const StoryworldCreateSchema = StoryworldSchema.pick({
  title: true,
  description: true,
  creator_id: true,
  tags: true,
  accessibility_notes: true,
  rating: true,
}).extend({
  owner_id: uuidSchema,
})

export type Storyworld = z.infer<typeof StoryworldSchema>
export type StoryworldCreate = z.infer<typeof StoryworldCreateSchema>

// ===== Character =====
const CharacterRelationshipSchema = z.object({
  target_id: uuidSchema,
  relationship_type: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
})

export const CharacterSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  name: z.string().min(1, 'Name required').max(255),
  role: z.string().min(1).max(255),
  title: z.string().optional(),
  description: z.string().max(5000),
  status: statusSchema.default('draft'),
  owner_id: uuidSchema,
  relationships: CharacterRelationshipSchema.array().default([]),
  appearance: z.object({
    age: z.number().int().nonnegative().optional(),
    physical_description: z.string().max(1000),
    distinguishing_features: z.string().array().default([]),
  }).optional(),
  background: z.string().max(5000).optional(),
  motivations: z.string().array().default([]),
  arcs: z.string().array().default([]),
  consent_status: approvalStatusSchema.optional(),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const CharacterCreateSchema = CharacterSchema.pick({
  storyworld_id: true,
  name: true,
  role: true,
  description: true,
  relationships: true,
  appearance: true,
  background: true,
  motivations: true,
  arcs: true,
  consent_status: true,
}).extend({
  owner_id: uuidSchema,
})

export type Character = z.infer<typeof CharacterSchema>
export type CharacterCreate = z.infer<typeof CharacterCreateSchema>

// ===== Location =====
export const LocationSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  name: z.string().min(1, 'Name required').max(255),
  title: z.string().optional(),
  description: z.string().max(5000),
  status: statusSchema.default('draft'),
  owner_id: uuidSchema,
  geography: z.object({
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    climate: z.string().max(255),
    terrain: z.string().max(255),
  }).optional(),
  landmarks: z.string().array().default([]),
  inhabitants: z.string().array().default([]),
  connected_locations: z.object({
    location_id: uuidSchema,
    connection_type: z.string().max(100),
    distance: z.string().max(100).optional(),
  }).array().default([]),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const LocationCreateSchema = LocationSchema.pick({
  storyworld_id: true,
  name: true,
  description: true,
  geography: true,
  landmarks: true,
  inhabitants: true,
  connected_locations: true,
}).extend({
  owner_id: uuidSchema,
})

export type Location = z.infer<typeof LocationSchema>
export type LocationCreate = z.infer<typeof LocationCreateSchema>

// ===== Event =====
export const StoryEventSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().max(5000),
  status: statusSchema.default('draft'),
  owner_id: uuidSchema,
  timestamp: dateSchema.optional(),
  era: z.string().max(255).optional(),
  participants: uuidSchema.array().default([]),
  location_ids: uuidSchema.array().default([]),
  triggers: z.string().array().default([]),
  consequences: z.string().array().default([]),
  media_references: uuidSchema.array().default([]),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const StoryEventCreateSchema = StoryEventSchema.pick({
  storyworld_id: true,
  title: true,
  description: true,
  timestamp: true,
  era: true,
  participants: true,
  location_ids: true,
  triggers: true,
  consequences: true,
  media_references: true,
}).extend({
  owner_id: uuidSchema,
})

export type StoryEvent = z.infer<typeof StoryEventSchema>
export type StoryEventCreate = z.infer<typeof StoryEventCreateSchema>

// ===== Rule =====
export const RuleSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().max(5000),
  status: statusSchema.default('draft'),
  owner_id: uuidSchema,
  applies_to: z.enum([
    'storyworld', 'character', 'location', 'object', 'event', 'theme', 'rule',
    'media_project', 'media_asset', 'rights_record', 'change_request',
    'continuity_issue', 'release_record', 'activity_event', 'suggestion',
  ]).array().default([]),
  exceptions: z.string().array().default([]),
  enforcement_level: z.enum(['strict', 'soft', 'aspirational']).default('strict'),
  related_rules: uuidSchema.array().default([]),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const RuleCreateSchema = RuleSchema.pick({
  storyworld_id: true,
  title: true,
  description: true,
  applies_to: true,
  exceptions: true,
  enforcement_level: true,
  related_rules: true,
}).extend({
  owner_id: uuidSchema,
})

export type Rule = z.infer<typeof RuleSchema>
export type RuleCreate = z.infer<typeof RuleCreateSchema>

// ===== ChangeRequest =====
export const ChangeRequestSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  entity_id: uuidSchema,
  entity_type: z.string(),
  current_value: z.any(),
  proposed_value: z.any(),
  reason: z.string().min(1).max(5000),
  evidence: z.string().max(5000).optional(),
  actor_id: uuidSchema,
  review_status: approvalStatusSchema.default('pending'),
  reviewer_id: uuidSchema.optional(),
  feedback: z.string().max(5000).optional(),
  applied_at: dateSchema.optional(),
  conflict_impact: z.string().max(5000).optional(),
  status: statusSchema.default('pending'),
  owner_id: uuidSchema,
  created_at: dateSchema,
  updated_at: dateSchema,
  reviewed_at: dateSchema.optional(),
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const ChangeRequestCreateSchema = ChangeRequestSchema.pick({
  storyworld_id: true,
  entity_id: true,
  entity_type: true,
  current_value: true,
  proposed_value: true,
  reason: true,
  evidence: true,
  actor_id: true,
  conflict_impact: true,
}).extend({
  owner_id: uuidSchema,
})

export type ChangeRequest = z.infer<typeof ChangeRequestSchema>
export type ChangeRequestCreate = z.infer<typeof ChangeRequestCreateSchema>

// ===== ReleaseRecord =====
export const ReleaseRecordSchema = z.object({
  id: uuidSchema,
  storyworld_id: uuidSchema,
  title: z.string().min(1).max(255),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  release_notes: z.string().max(10000),
  proposed_by: uuidSchema,
  proposal_date: dateSchema,
  approval_status: approvalStatusSchema.default('pending'),
  approver_id: uuidSchema.optional(),
  approval_date: dateSchema.optional(),
  snapshot: z.object({
    canon_version: z.number().int().nonnegative(),
    change_requests_frozen: z.boolean(),
    continuity_validated: z.boolean(),
    rights_validated: z.boolean(),
    accessibility_checked: z.boolean(),
  }).optional(),
  blockers: z.enum(['continuity', 'rights', 'consent', 'accessibility', 'approvals']).array().default([]),
  published_at: dateSchema.optional(),
  publication_url: z.string().url().optional(),
  status: statusSchema.default('pending'),
  owner_id: uuidSchema,
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export const ReleaseRecordCreateSchema = ReleaseRecordSchema.pick({
  storyworld_id: true,
  title: true,
  version: true,
  release_notes: true,
  proposed_by: true,
  proposal_date: true,
}).extend({
  owner_id: uuidSchema,
})

export type ReleaseRecord = z.infer<typeof ReleaseRecordSchema>
export type ReleaseRecordCreate = z.infer<typeof ReleaseRecordCreateSchema>

// ===== ActivityEvent =====
export const ActivityEventSchema = z.object({
  id: uuidSchema,
  actor_id: uuidSchema,
  action: z.string().min(1).max(255),
  entity_id: uuidSchema.optional(),
  entity_type: z.string().optional(),
  changes: z.object({
    field: z.string(),
    before: z.any(),
    after: z.any(),
  }).array().optional(),
  timestamp: dateSchema,
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  status: z.enum(['success', 'failure']).default('success'),
  error_message: z.string().max(1000).optional(),
  created_at: dateSchema,
  updated_at: dateSchema,
  provenance: z.object({
    source: z.string(),
    confidence: z.number().min(0).max(1),
    last_verified: dateSchema,
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export type ActivityEvent = z.infer<typeof ActivityEventSchema>

// Export all schemas as a collection
export const AllSchemas = {
  Storyworld: StoryworldSchema,
  Character: CharacterSchema,
  Location: LocationSchema,
  StoryEvent: StoryEventSchema,
  Rule: RuleSchema,
  ChangeRequest: ChangeRequestSchema,
  ReleaseRecord: ReleaseRecordSchema,
  ActivityEvent: ActivityEventSchema,
}
