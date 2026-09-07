'use client'

import { useMemo, useState } from 'react'
import { Archive, BookOpen, Check, ChevronRight, CircleAlert, Compass, FileAudio, Film, Home as HomeIcon, Layers3, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, SquarePen, Timer, Users, X } from 'lucide-react'

type Status = 'Draft' | 'Needs Evidence' | 'Needs Review' | 'Conflict Found' | 'Approved' | 'Scheduled' | 'Published' | 'Archived'

type Character = { name: string; role: string; status: Status; note: string }

const characters: Character[] = [
  { name: 'Mara Venn', role: 'Tide Cartographer', status: 'Approved', note: 'Maps the flooded coast by memory, not instruments.' },
  { name: 'Ilyan Sore', role: 'Signal Keeper', status: 'Needs Review', note: 'Hears a second voice inside the lighthouse frequency.' },
  { name: 'Sena Quill', role: 'Archive Diver', status: 'Conflict Found', note: 'Returns with artifacts the archive says never existed.' },
  { name: 'Orren Vale', role: 'Harbor Magistrate', status: 'Approved', note: 'Keeps the last dry district under quiet quarantine.' },
  { name: 'Tavi Reed', role: 'Weather Child', status: 'Draft', note: 'Can predict storms by tasting rainwater.' },
  { name: 'The Witness', role: 'Unresolved', status: 'Needs Evidence', note: 'A name erased from every surviving ledger.' },
]

const nav = [
  { label: 'Overview', icon: HomeIcon }, { label: 'Storyworld', icon: Compass }, { label: 'Bible', icon: BookOpen },
  { label: 'Timeline', icon: Timer }, { label: 'Continuity', icon: CircleAlert }, { label: 'Media', icon: Film },
  { label: 'Rights', icon: ShieldCheck }, { label: 'Release', icon: Archive },
]

const statusClass: Record<Status, string> = {
  Draft: 'status-draft', 'Needs Evidence': 'status-evidence', 'Needs Review': 'status-review', 'Conflict Found': 'status-conflict', Approved: 'status-approved', Scheduled: 'status-scheduled', Published: 'status-published', Archived: 'status-archived',
}

function StatusPill({ status }: { status: Status }) { return <span className={`status-pill ${statusClass[status]}`}>{status}</span> }

function Metric({ label, value, detail, tone = '' }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

export default function Home() {
  const [active, setActive] = useState('Overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestState, setRequestState] = useState<'pending' | 'approved'>('pending')

  const filtered = useMemo(() => characters.filter((character) => `${character.name} ${character.role} ${character.note}`.toLowerCase().includes(search.toLowerCase())), [search])

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2800) }

  return <div className="app-shell">
    <aside className="desktop-rail">
      <div className="brand-mark"><span className="brand-glyph">L</span><div><strong>LumenArchive</strong><small>Creator control room</small></div></div>
      <div className="world-switcher"><span className="eyebrow">ACTIVE STORYWORLD</span><strong>Glass Tide</strong><span className="world-meta"><span className="live-dot" /> Local demo · v0.8</span></div>
      <nav className="rail-nav" aria-label="Studio navigation">{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(label)}><Icon size={17} /><span>{label}</span>{label === 'Continuity' && <b>3</b>}</button>)}</nav>
      <div className="rail-footer"><button className="nav-item" onClick={() => setActive('Settings')}><Settings size={17} /><span>Settings</span></button><div className="creator-chip"><span className="avatar">AV</span><div><strong>Arden Vale</strong><small>Creator · local</small></div><ChevronRight size={14} /></div></div>
    </aside>

    <main className="main-column">
      <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div><span className="breadcrumb">STORYWORLD / {active.toUpperCase()}</span><h1>{active === 'Overview' ? 'Good evening, Arden.' : active}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Search" onClick={() => document.getElementById('archive-search')?.focus()}><Search size={19} /></button><button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={17} /> <span>Create</span></button></div></header>

      <div className="content">
        <section className="notice-bar"><span className="notice-icon"><ShieldCheck size={16} /></span><div><strong>Canon protection is active</strong><span>Direct edits become reviewable change requests. Nothing silently overwrites the Bible.</span></div><button onClick={() => notify('Canon policy is documented in Security & Privacy.')}>Learn more <ChevronRight size={14} /></button></section>

        <section className="hero-grid"><div className="hero-copy"><span className="eyebrow accent">ACTIVE STORYWORLD · GLASS TIDE</span><h2>A world with a memory<br />of its own.</h2><p>Build connected stories from one protected source of truth. The sea keeps what the archive forgets.</p><div className="hero-actions"><button className="primary-button" onClick={() => setActive('Storyworld')}>Open storyworld <ChevronRight size={16} /></button><button className="text-button" onClick={() => setRequestOpen(true)}><SquarePen size={15} /> Review pending changes</button></div></div><div className="hero-art" aria-label="Abstract map of the Glass Tide storyworld"><div className="art-label">GLASS TIDE <span>01 / 05</span></div><div className="tide-line line-one" /><div className="tide-line line-two" /><div className="tide-line line-three" /><span className="map-point point-one">Drowned Observatory</span><span className="map-point point-two">The Salt District</span><span className="map-point point-three">Northwater</span><div className="compass">N<br /><span>◒</span><br />S</div></div></section>

        <section className="metrics"><Metric label="Canon health" value="72%" detail="3 conflicts need review" tone="warning" /><Metric label="Active projects" value="05" detail="Across five media forms" /><Metric label="Release readiness" value="41%" detail="Glass Tide · pilot" tone="orchid" /><Metric label="Rights coverage" value="84%" detail="2 assets need evidence" tone="teal" /></section>

        <div className="section-heading"><div><span className="eyebrow">STORYWORLD BIBLE</span><h3>The living archive</h3></div><button className="text-button" onClick={() => setActive('Bible')}>View all <ChevronRight size={15} /></button></div>
        <section className="archive-grid"><article className="feature-card"><div className="card-top"><span className="icon-tile brass"><Users size={19} /></span><StatusPill status="Approved" /></div><h4>Characters</h4><strong className="large-count">06</strong><p>People, voices, and contradictions held inside the tide.</p><button onClick={() => setActive('Bible')}>Open collection <ChevronRight size={15} /></button></article><article className="feature-card dark-card"><div className="card-top"><span className="icon-tile orchid"><Layers3 size={19} /></span><StatusPill status="Needs Review" /></div><h4>Locations & objects</h4><strong className="large-count">11</strong><p>Places that shift when observed. Objects with provenance.</p><button onClick={() => setActive('Storyworld')}>Explore the map <ChevronRight size={15} /></button></article><article className="feature-card"><div className="card-top"><span className="icon-tile teal"><Timer size={19} /></span><StatusPill status="Conflict Found" /></div><h4>Timeline</h4><strong className="large-count">12</strong><p>Events connected across memory, media, and possible futures.</p><button onClick={() => setActive('Timeline')}>Inspect timeline <ChevronRight size={15} /></button></article></section>

        <section className="workspace-section"><div className="section-heading"><div><span className="eyebrow">CANON EXPLORER</span><h3>People in the archive</h3></div><div className="search-wrap"><Search size={15} /><input id="archive-search" placeholder="Search canon" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="character-list">{filtered.map((character) => <button key={character.name} className="character-row" onClick={() => notify(`${character.name} opened in protected view.`)}><span className="portrait">{character.name.split(' ').map((part) => part[0]).join('')}</span><span className="character-main"><strong>{character.name}</strong><small>{character.role}</small></span><span className="character-note">{character.note}</span><StatusPill status={character.status} /><ChevronRight size={16} /></button>)}{filtered.length === 0 && <div className="empty-state"><Search size={20} /><strong>No canon records found</strong><span>Try a different search term.</span></div>}</div></section>

        <section className="bottom-grid"><article className="activity-card"><div className="section-heading compact"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Archive trail</h3></div><button className="icon-button" aria-label="Activity settings"><Menu size={17} /></button></div><div className="activity-item"><span className="activity-dot brass-dot" /><div><strong>Change request created</strong><p>Sena Quill · voice description</p><small>14 minutes ago · awaiting approval</small></div></div><div className="activity-item"><span className="activity-dot teal-dot" /><div><strong>Evidence attached</strong><p>Northwater location record</p><small>1 hour ago · Arden Vale</small></div></div><div className="activity-item"><span className="activity-dot orchid-dot" /><div><strong>Suggestion applied to draft</strong><p>Episode 02 · The Long Descent</p><small>Yesterday · AI-assisted, human reviewed</small></div></div></article><article className="release-card"><div className="card-top"><span className="eyebrow">NEXT RELEASE</span><StatusPill status="Needs Review" /></div><h3>Glass Tide<br /><em>pilot collection</em></h3><div className="release-progress"><span style={{ width: '41%' }} /></div><div className="release-foot"><span>4 of 10 gates passed</span><button className="text-button" onClick={() => setActive('Release')}>Open release control <ChevronRight size={14} /></button></div><div className="gate-list"><span><X size={13} /> 3 continuity conflicts</span><span><Check size={13} /> Rights coverage</span><span><X size={13} /> Accessibility metadata</span></div></article></section>
      </div>

      <nav className="mobile-bottom" aria-label="Mobile navigation">{nav.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={19} /><span>{label === 'Overview' ? 'Home' : label}</span></button>)}<button onClick={() => setCreateOpen(true)}><Plus size={20} /><span>Create</span></button></nav>
    </main>

    {mobileNav && <div className="sheet-backdrop" onClick={() => setMobileNav(false)}><aside className="mobile-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-header"><strong>Navigate archive</strong><button className="icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19} /></button></div>{nav.map(({ label, icon: Icon }) => <button key={label} className="nav-item" onClick={() => { setActive(label); setMobileNav(false) }}><Icon size={18} /><span>{label}</span></button>)}</aside></div>}
    {createOpen && <div className="sheet-backdrop" onClick={() => setCreateOpen(false)}><section className="create-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-header"><div><span className="eyebrow">NEW ARCHIVE ITEM</span><h3>Create something connected</h3></div><button className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close create sheet"><X size={19} /></button></div><div className="create-grid">{[['Character', Users], ['Location', Compass], ['Media project', Film], ['Change request', SquarePen], ['Timeline event', Timer], ['Rights record', ShieldCheck]].map(([label, Icon]) => <button key={label as string} className="create-option" onClick={() => { setCreateOpen(false); notify(`${label} draft created locally.`) }}><span className="icon-tile brass">{typeof Icon === 'function' ? <Icon size={19} /> : null}</span><strong>{label as string}</strong><small>Draft · protected workflow</small></button>)}</div><p className="disclosure"><Sparkles size={15} /> Everything starts as a local draft. Canon changes require review.</p></section></div>}
    {requestOpen && <div className="sheet-backdrop" onClick={() => setRequestOpen(false)}><section className="request-dialog" role="dialog" aria-modal="true" aria-labelledby="request-title" onClick={(event) => event.stopPropagation()}><div className="sheet-header"><div><span className="eyebrow">CHANGE REQUEST · CR-004</span><h3 id="request-title">Sena Quill voice description</h3></div><button className="icon-button" onClick={() => setRequestOpen(false)} aria-label="Close change request"><X size={19} /></button></div><div className="diff-block"><div><span>CANON VALUE</span><p>“Speaks in a low register, careful with every word.”</p></div><ChevronRight size={18} /><div className="proposed"><span>PROPOSED VALUE</span><p>“Voice carries a harmonic undertow recorded near Northwater.”</p></div></div><div className="request-meta"><span><strong>Evidence</strong> Field recording · NW-22</span><span><strong>Impact</strong> Medium · affects 2 media drafts</span><span><strong>Actor</strong> Arden Vale · today</span></div>{requestState === 'pending' ? <div className="dialog-actions"><button className="secondary-button" onClick={() => { setRequestOpen(false); notify('Change request dismissed.') }}>Dismiss</button><button className="primary-button" onClick={() => { setRequestState('approved'); setRequestOpen(false); notify('Approved request queued for canon version 0.9.') }}><Check size={16} /> Approve change</button></div> : <div className="approved-banner"><Check size={16} /> Approved · queued for canon version 0.9</div>}</section></div>}
    {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
  </div>
}
