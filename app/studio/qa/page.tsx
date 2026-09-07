import Link from 'next/link'
import { CheckCircle2, CircleAlert, ArrowLeft } from 'lucide-react'
import { glassTide, releaseBlockers } from '@/lib/domain'

export default function QAPage() {
  const project = glassTide.media[0]
  const blockers = releaseBlockers(project)
  const checks = [{label:'Seeded canon loaded', pass:glassTide.characters.length === 6}, {label:'Protected change requests present', pass:glassTide.changes.length > 0}, {label:'Release gates fail closed', pass:blockers.length > 0}, {label:'Rights metadata present', pass:glassTide.characters.every((character) => Boolean(character.rights.provenance))}]
  return <main className="qa-page"><Link href="/" className="qa-back"><ArrowLeft size={16}/> Back to archive</Link><span className="eyebrow">LUMENARCHIVE · INTERNAL QA</span><h1>Deterministic health checks</h1><p className="qa-intro">Local prototype verification for Glass Tide. Green checks indicate deterministic local behavior only; they do not certify external integrations.</p><section className="qa-card"><div className="qa-summary"><strong>{checks.filter((check) => check.pass).length}/{checks.length}</strong><span>checks passed</span></div>{checks.map((check) => <div className="qa-row" key={check.label}>{check.pass ? <CheckCircle2 className="qa-pass" size={18}/> : <CircleAlert className="qa-fail" size={18}/>}<span>{check.label}</span><small>{check.pass ? 'PASS' : 'BLOCKED'}</small></div>)}</section><section className="qa-card"><span className="eyebrow">RELEASE BLOCKERS · {project.title.toUpperCase()}</span><h2>{blockers.length} gates require attention</h2>{blockers.map((blocker) => <div className="qa-blocker" key={blocker}><CircleAlert size={15}/>{blocker}</div>)}</section></main>
}
