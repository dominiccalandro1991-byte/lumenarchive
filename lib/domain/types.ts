/**
 * Core Domain Types for LumenArchive
 * 
 * These types represent the immutable business entities:
 * - Storyworld: root aggregate, contains all canon
 * - Character, Location, Object: canonical entities
 * - Event, Theme, Rule: canon relationships
 * - MediaProject, MediaAsset: media metadata
 * - RightsRecord, ChangeRequest, ContinuityIssue, ReleaseRecord: governance
 * - ActivityEvent, Suggestion: telemetry and audit
 */

export type EntityType =
  | 'storyworld'
  | 'character'
  | 'location'
  | 'object'
  | 'event'
  | 'theme'
  | 'rule'
  | 'media_project'
  | 'media_asset'
  | 'rights_record'
  | 'change_request'
  | 'continuity_issue'
  | 'release_record'
  | 'activity_event'
  | 'suggestion'

export type EntityStatus = 'draft' | 'canon' | 'archived' | 'pending' | 'approved' | 'rejected'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ReleaseGate = 'continuity' | 'rights' | 'consent' | 'accessibility' | 'approvals'

/**
 * Base entity with common metadata
 */
export interface BaseEntity {
  id: string
  title?: string
  name?: string
  status: EntityStatus
  owner_id: string
  created_at: Date
  updated_at: Date
  provenance?: {
    source: string
    confidence: number
    last_verified: Date
  }
  metadata?: Record<string, any>
}

/**
 * Storyworld: Root aggregate containing all canon
 */
export interface Storyworld extends BaseEntity {
  description: string
  creator_id: string
  version: number
  tags: string[]
  accessibility_notes?: string
  rating?: {
    age_rating: string
    content_warnings: string[]
  }
}

/**
 * Character: Canonical character entity
 */
export interface Character extends BaseEntity {
  storyworld_id: string
  name: string
  role: string
  description: string
  relationships: CharacterRelationship[]
  appearance?: {
    age: number
    physical_description: string
    distinguishing_features: string[]
  }
  background?: string
  motivations?: string[]
  arcs?: string[]
  consent_status?: ApprovalStatus
}

export interface CharacterRelationship {
  target_id: string
  relationship_type: string
  description: string
}

/**
 * Location: Canonical location entity
 */
export interface Location extends BaseEntity {
  storyworld_id: string
  name: string
  description: string
  geography?: {
    coordinates?: [number, number]
    climate: string
    terrain: string
  }
  landmarks?: string[]
  inhabitants?: string[]
  connected_locations?: {
    location_id: string
    connection_type: string
    distance?: string
  }[]
}

/**
 * Object: Physical or abstract object in the storyworld
 */
export interface StoryObject extends BaseEntity {
  storyworld_id: string
  name: string
  description: string
  object_type: string
  significance: string
  associated_characters?: string[]
  associated_locations?: string[]
  magical_properties?: string[]
}

/**
 * Event: Significant happening in storyworld timeline
 */
export interface StoryEvent extends BaseEntity {
  storyworld_id: string
  title: string
  description: string
  timestamp?: Date
  era?: string
  participants: string[] // character IDs
  location_ids: string[]
  triggers: string[] // prior events or conditions
  consequences: string[] // subsequent events or changes
  media_references?: string[] // media asset IDs
}

/**
 * Theme: Thematic element across the storyworld
 */
export interface Theme extends BaseEntity {
  storyworld_id: string
  name: string
  description: string
  manifestations: string[] // where theme appears
  related_themes?: string[] // other theme IDs
}

/**
 * Rule: Canon constraint or law of the storyworld
 */
export interface Rule extends BaseEntity {
  storyworld_id: string
  title: string
  description: string
  applies_to: EntityType[]
  exceptions?: string[]
  enforcement_level: 'strict' | 'soft' | 'aspirational'
  related_rules?: string[] // other rule IDs
}

/**
 * MediaProject: Planned media product
 */
export interface MediaProject extends BaseEntity {
  storyworld_id: string
  title: string
  description: string
  project_type: 'novel' | 'series' | 'game' | 'comic' | 'film' | 'other'
  status: 'planning' | 'development' | 'production' | 'post_production' | 'published'
  target_audience?: string
  timeline?: {
    start_date?: Date
    target_completion?: Date
  }
  lead_creator?: string
  collaborators?: string[]
  media_assets: string[] // asset IDs
}

/**
 * MediaAsset: Single media object (image, audio, video, document, etc.)
 */
export interface MediaAsset extends BaseEntity {
  storyworld_id: string
  title: string
  description: string
  media_type: 'image' | 'audio' | 'video' | 'document' | 'code' | 'other'
  file_url?: string
  file_size?: number
  mime_type?: string
  created_by?: string
  featured_in?: string[] // project IDs or event IDs
  accessibility?: {
    alt_text?: string
    captions?: string
    transcript?: string
  }
  rights_status?: ApprovalStatus
}

/**
 * RightsRecord: Rights and consent tracking
 */
export interface RightsRecord extends BaseEntity {
  storyworld_id: string
  entity_id: string
  entity_type: EntityType
  rights_holder: string
  rights_type: 'copyright' | 'trademark' | 'patent' | 'moral_rights' | 'consent' | 'other'
  rights_territory: string
  grant_date: Date
  expiration_date?: Date
  terms: string
  consent_status: ApprovalStatus
  approver_id?: string
  approval_date?: Date
  notes?: string
}

/**
 * ChangeRequest: Proposal to modify canon
 */
export interface ChangeRequest extends BaseEntity {
  storyworld_id: string
  entity_id: string
  entity_type: EntityType
  current_value: any
  proposed_value: any
  reason: string
  evidence?: string
  actor_id: string
  review_status: ApprovalStatus
  reviewer_id?: string
  feedback?: string
  applied_at?: Date
  conflict_impact?: string
  created_at: Date
  reviewed_at?: Date
}

/**
 * ContinuityIssue: Detected continuity problem
 */
export interface ContinuityIssue extends BaseEntity {
  storyworld_id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  affected_entities: {
    entity_id: string
    entity_type: EntityType
  }[]
  related_rule?: string
  resolution_proposed?: string
  resolved: boolean
  resolution_applied_at?: Date
  resolver_id?: string
}

/**
 * ReleaseRecord: Snapshot of storyworld ready for publication
 */
export interface ReleaseRecord extends BaseEntity {
  storyworld_id: string
  title: string
  version: string
  release_notes: string
  proposed_by: string
  proposal_date: Date
  approval_status: ApprovalStatus
  approver_id?: string
  approval_date?: Date
  snapshot?: {
    canon_version: number
    change_requests_frozen: boolean
    continuity_validated: boolean
    rights_validated: boolean
    accessibility_checked: boolean
  }
  blockers: ReleaseGate[]
  published_at?: Date
  publication_url?: string
}

/**
 * ActivityEvent: Audit trail and telemetry event
 */
export interface ActivityEvent extends BaseEntity {
  actor_id: string
  action: string
  entity_id?: string
  entity_type?: EntityType
  changes?: {
    field: string
    before: any
    after: any
  }[]
  timestamp: Date
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failure'
  error_message?: string
}

/**
 * Suggestion: AI or system suggestion (not authoritative)
 */
export interface Suggestion extends BaseEntity {
  storyworld_id: string
  target_entity_id: string
  target_entity_type: EntityType
  suggestion_type: 'continuity' | 'character' | 'plot' | 'worldbuilding' | 'other'
  content: string
  reasoning: string
  confidence: number
  source: 'ai_assistant' | 'user_prompt' | 'system_analysis'
  status: 'pending' | 'accepted' | 'rejected' | 'applied'
  reviewer_id?: string
  review_notes?: string
  reviewed_at?: Date
}
