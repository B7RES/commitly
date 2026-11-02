import type { ReactNode } from 'react'
import { CreditCard, FileJson, Landmark, Plus, RefreshCw, Wallet } from 'lucide-react'

export type PaymentIconKind = 'subscription' | 'financing' | 'bill' | 'other'

export function StatCard({ icon, label, value, hint, accent }: { icon: ReactNode; label: string; value: string; hint: string; accent?: boolean }) { return <div className="stat-card"><div className={`stat-icon ${accent ? 'accent' : ''}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div> }
export function PaymentIcon({ kind }: { kind: PaymentIconKind }) { if (kind === 'financing') return <Landmark size={19} />; if (kind === 'bill') return <FileJson size={19} />; if (kind === 'other') return <RefreshCw size={19} />; return <CreditCard size={19} /> }
export function EmptyState({ title, text, action }: { title: string; text: string; action?: () => void }) { return <div className="empty-state"><div className="empty-icon"><Wallet size={23} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="primary-btn" onClick={action}><Plus size={16} /> Aggiungi impegno</button>}</div> }
