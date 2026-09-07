import { z } from 'zod'

export const statusSchema = z.enum(['Draft','Needs Evidence','Needs Review','Conflict Found','Approved','Scheduled','Published','Archived'])
export type Status = z.infer<typeof statusSchema>
export const rightsSchema = z.object({ owner: z.string().min(1), status: z.enum(['verified','needs-evidence','restricted']), license: z.string().min(1), attribution: z.string().min(1), consent: z.enum(['not-applicable','pending','granted','withdrawn']), provenance: z.string().min(1) })
export type RightsRecord = z.infer<typeof rightsSchema>
export const characterSchema = z.object({ id: z.string(), name: z.string().min(1), role: z.string().min(1), status: statusSchema, note: z.string(), rights: rightsSchema })
export type Character = z.infer<typeof characterSchema>
export const changeRequestSchema = z.object({ id: z.string(), entityId: z.string(), currentValue: z.string(), proposedValue: z.string().min(1), reason: z.string().min(1), evidence: z.string().min(1), actor: z.string().min(1), reviewStatus: z.enum(['pending','approved','dismissed']), conflictImpact: z.string().min(1), createdAt: z.string() })
export type ChangeRequest = z.infer<typeof changeRequestSchema>
export const mediaProjectSchema = z.object({ id: z.string(), title: z.string().min(1), type: z.enum(['podcast','mini-series','mini-book','full-book','story-room']), status: statusSchema, owner: z.string().min(1), rating: z.string().min(1), accessibility: z.boolean(), provenance: z.boolean(), rights: rightsSchema })
export type MediaProject = z.infer<typeof mediaProjectSchema>
export type Storyworld = { id: string; name: string; version: string; characters: Character[]; media: MediaProject[]; changes: ChangeRequest[] }

export const glassTide: Storyworld = {
  id: 'glass-tide', name: 'Glass Tide', version: '0.8',
  characters: [
    { id:'mara-venn', name:'Mara Venn', role:'Tide Cartographer', status:'Approved', note:'Maps the flooded coast by memory, not instruments.', rights:{owner:'Arden Vale',status:'verified',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
    { id:'ilyan-sore', name:'Ilyan Sore', role:'Signal Keeper', status:'Needs Review', note:'Hears a second voice inside the lighthouse frequency.', rights:{owner:'Arden Vale',status:'verified',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
    { id:'sena-quill', name:'Sena Quill', role:'Archive Diver', status:'Conflict Found', note:'Returns with artifacts the archive says never existed.', rights:{owner:'Arden Vale',status:'needs-evidence',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
    { id:'orren-vale', name:'Orren Vale', role:'Harbor Magistrate', status:'Approved', note:'Keeps the last dry district under quiet quarantine.', rights:{owner:'Arden Vale',status:'verified',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
    { id:'tavi-reed', name:'Tavi Reed', role:'Weather Child', status:'Draft', note:'Can predict storms by tasting rainwater.', rights:{owner:'Arden Vale',status:'restricted',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
    { id:'the-witness', name:'The Witness', role:'Unresolved', status:'Needs Evidence', note:'A name erased from every surviving ledger.', rights:{owner:'Arden Vale',status:'needs-evidence',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored canon'} },
  ],
  media:[
    {id:'glass-tide-podcast',title:'Glass Tide: Pilot',type:'podcast',status:'Needs Review',owner:'Arden Vale',rating:'Teen',accessibility:false,provenance:true,rights:{owner:'Arden Vale',status:'verified',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'Creator-authored draft'}},
    {id:'long-descent',title:'The Long Descent',type:'mini-series',status:'Draft',owner:'Arden Vale',rating:'Teen',accessibility:true,provenance:false,rights:{owner:'Arden Vale',status:'needs-evidence',license:'Original creator license',attribution:'Arden Vale',consent:'not-applicable',provenance:'AI-assisted local draft'}},
  ],
  changes:[{id:'CR-004',entityId:'sena-quill',currentValue:'Speaks in a low register, careful with every word.',proposedValue:'Voice carries a harmonic undertow recorded near Northwater.',reason:'Align voice detail with field recording.',evidence:'Field recording NW-22',actor:'Arden Vale',reviewStatus:'pending',conflictImpact:'Medium · affects 2 media drafts',createdAt:'2026-09-06'}]
}

export function releaseBlockers(project: MediaProject) { const blockers: string[] = []; if (!project.title) blockers.push('Missing title'); if (!project.owner) blockers.push('Missing creator/owner'); if (project.rights.status !== 'verified') blockers.push('Rights evidence incomplete'); if (!project.rating) blockers.push('Content rating missing'); if (!project.accessibility) blockers.push('Accessibility metadata missing'); if (!project.provenance) blockers.push('Provenance disclosure missing'); if (project.status === 'Conflict Found') blockers.push('High-severity continuity conflict'); return blockers }

export function createChangeRequest(input: unknown): ChangeRequest { return changeRequestSchema.parse(input) }
