import { useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, Filter, PauseCircle, Plus, Search } from 'lucide-react'
import { EmptyState } from '../../components/shared'
import { useCommitmentList, type CommitmentListSortOrder } from '../../hooks/useCommitmentList'
import { resolveMonthlyEquivalentCents, resolveTermAtDate, toIsoDate } from '../../hooks/commitmentReadModel'
import type { CommitmentStatus, CommitmentType, TermFrequency } from '../../types/index'
import { dateLabel } from '../../lib/utils'

const typeLabels: Record<CommitmentType | 'all', string> = {
    all: 'Tutte le tipologie',
    subscription: 'Abbonamenti',
    recurring: 'Ricorrenti',
    financing: 'Finanziamenti'
}

const statusLabels: Record<CommitmentStatus | 'all', string> = {
    all: 'Tutti gli stati',
    active: 'Attivi',
    paused: 'In pausa',
    completed: 'Completati',
    archived: 'Archiviati'
}

const frequencyLabels: Record<TermFrequency, string> = {
    weekly: 'Settimanale',
    monthly: 'Mensile',
    quarterly: 'Trimestrale',
    yearly: 'Annuale',
    once: 'Una tantum'
}

const statusClassByValue: Record<CommitmentStatus, string> = {
    active: 'active',
    paused: 'paused',
    completed: 'completed',
    archived: 'archived'
}

const statusTextByValue: Record<CommitmentStatus, string> = {
    active: 'Attivo',
    paused: 'In pausa',
    completed: 'Completato',
    archived: 'Archiviato'
}

function formatCurrency(cents: number, currency: string): string {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol'
    }).format((cents || 0) / 100)
}

function addDays(base: Date, days: number): Date {
    const next = new Date(base)
    next.setDate(next.getDate() + days)
    return next
}

interface CommitmentsPageProps {
    onNewCommitment: () => void
    onOpenCommitment: (commitmentId: string) => void
}

export function CommitmentsPage({ onNewCommitment, onOpenCommitment }: CommitmentsPageProps) {
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<CommitmentType | 'all'>('all')
    const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'all'>('all')
    const [sortOrder, setSortOrder] = useState<CommitmentListSortOrder>('asc')

    const list = useCommitmentList({
        query,
        status: statusFilter,
        sortBy: 'nextDueDate',
        sortOrder
    })

    const filteredItems = useMemo(() => {
        if (typeFilter === 'all') return list.items
        return list.items.filter(entry => entry.item.commitment.type === typeFilter)
    }, [list.items, typeFilter])

    const todayIso = toIsoDate(new Date())
    const in30DaysIso = toIsoDate(addDays(new Date(), 30))

    const summary = useMemo(() => {
        const activeItems = filteredItems.filter(entry => entry.item.commitment.status === 'active')
        const monthlyByCurrency = new Map<string, number>()

        for (const entry of activeItems) {
            const currency = entry.item.commitment.currency || 'EUR'
            const equivalent = resolveMonthlyEquivalentCents(entry.item.terms, todayIso)
            const running = monthlyByCurrency.get(currency) ?? 0
            monthlyByCurrency.set(currency, running + equivalent)
        }

        const upcomingCount = activeItems.filter(entry => entry.nextDueDate && entry.nextDueDate >= todayIso && entry.nextDueDate <= in30DaysIso).length

        return {
            activeCount: activeItems.length,
            monthlyByCurrency: Array.from(monthlyByCurrency.entries()),
            upcomingCount
        }
    }, [filteredItems, in30DaysIso, todayIso])

    return <section className="page-wrap commitments-page">
        <div className="page-heading">
            <div>
                <div className="eyebrow">MODELLO IMPEGNI</div>
                <h1>Impegni</h1>
                <p>Gestisci abbonamenti, ricorrenti e finanziamenti.</p>
            </div>
            <button className="primary-btn" onClick={onNewCommitment}><Plus size={17} /> Nuovo impegno</button>
        </div>

        <div className="stats-grid commitments-stats">
            <div className="stat-card"><div className="stat-icon"><PauseCircle size={16} /></div><div className="stat-label">Impegni attivi</div><div className="stat-value">{summary.activeCount}</div><div className="stat-hint">Filtri correnti applicati</div></div>
            <div className="stat-card"><div className="stat-icon"><Filter size={16} /></div><div className="stat-label">Mensile equivalente</div><div className="stat-value commitments-money">{summary.monthlyByCurrency.length ? summary.monthlyByCurrency.map(([currency, cents]) => formatCurrency(cents, currency)).join(' · ') : '0,00 €'}</div><div className="stat-hint">Calcolato dai termini attivi</div></div>
            <div className="stat-card"><div className="stat-icon"><CalendarClock size={16} /></div><div className="stat-label">Prossime scadenze</div><div className="stat-value">{summary.upcomingCount}</div><div className="stat-hint">Entro 30 giorni</div></div>
        </div>

        <div className="toolbar">
            <div className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca un impegno..." /></div>
            <div className="filter-box"><Filter size={16} />
                <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as CommitmentType | 'all')}>
                    <option value="all">{typeLabels.all}</option>
                    <option value="subscription">{typeLabels.subscription}</option>
                    <option value="recurring">{typeLabels.recurring}</option>
                    <option value="financing">{typeLabels.financing}</option>
                </select>
            </div>
            <div className="filter-box"><Filter size={16} />
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as CommitmentStatus | 'all')}>
                    <option value="all">{statusLabels.all}</option>
                    <option value="active">{statusLabels.active}</option>
                    <option value="paused">{statusLabels.paused}</option>
                    <option value="completed">{statusLabels.completed}</option>
                    <option value="archived">{statusLabels.archived}</option>
                </select>
            </div>
            <div className="filter-box"><Filter size={16} />
                <select value={sortOrder} onChange={event => setSortOrder(event.target.value as CommitmentListSortOrder)}>
                    <option value="asc">Scadenza: prima le vicine</option>
                    <option value="desc">Scadenza: prima le lontane</option>
                </select>
            </div>
        </div>

        {list.error && <div className="panel commitments-error">Errore caricamento impegni: {list.error}</div>}

        {!list.error && <div className="commitment-list">
            {filteredItems.length ? filteredItems.map(entry => {
                const commitment = entry.item.commitment
                const termDate = entry.nextDueDate ?? todayIso
                const term = resolveTermAtDate(entry.item.terms, termDate)
                const amountCents = term?.amountCents ?? 0
                const frequency = term ? frequencyLabels[term.frequency] : 'Frequenza non disponibile'

                return <button className="commitment-card" key={commitment.id} onClick={() => onOpenCommitment(commitment.id)}>
                    <div className="commitment-main">
                        <div className="commitment-head">
                            <h3>{commitment.title}</h3>
                            <span className={`status ${statusClassByValue[commitment.status]}`}>{statusTextByValue[commitment.status]}</span>
                        </div>
                        <div className="commitment-meta">
                            <span>{typeLabels[commitment.type]}</span><i />
                            <span>{commitment.category}</span><i />
                            <span>{frequency}</span>
                        </div>
                        <div className="commitment-details">
                            <span>Prossima scadenza: {entry.nextDueDate ? dateLabel(entry.nextDueDate) : 'Da definire'}</span>
                        </div>
                    </div>
                    <div className="commitment-side">
                        <strong>{formatCurrency(amountCents, commitment.currency || 'EUR')}</strong>
                        <small>{commitment.currency || 'EUR'}</small>
                        <span className="text-btn">Dettaglio <ArrowRight size={14} /></span>
                    </div>
                </button>
            }) : <EmptyState title={list.loading ? 'Caricamento impegni' : (query ? 'Nessun risultato' : 'Ancora nessun impegno')} text={list.loading ? 'Caricamento in corso.' : (query ? 'Prova con un termine diverso o modifica i filtri.' : 'Crea il primo impegno per iniziare a monitorare le scadenze.')} action={!list.loading ? onNewCommitment : undefined} />}
        </div>}
    </section>
}
