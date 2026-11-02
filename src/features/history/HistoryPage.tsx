import { useState } from 'react'
import { Check, Filter, RotateCcw, Search } from 'lucide-react'
import { EmptyState } from '../../components/shared'
import {
    usePaymentHistoryList,
    type PaymentHistorySortBy,
    type PaymentHistorySortOrder
} from '../../hooks/usePaymentHistoryList'
import type { PaymentHistoryStatus } from '../../types/index'
import { dateLabel } from '../../lib/utils'

const statusLabel: Record<PaymentHistoryStatus, string> = {
    paid: 'Pagato',
    skipped: 'Saltato'
}

function formatCurrency(cents: number, currency: string): string {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol'
    }).format((cents || 0) / 100)
}

export function HistoryPage() {
    const [query, setQuery] = useState('')
    const [commitmentId, setCommitmentId] = useState('all')
    const [status, setStatus] = useState<PaymentHistoryStatus | 'all'>('all')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [sortBy, setSortBy] = useState<PaymentHistorySortBy>('actionDate')
    const [sortOrder, setSortOrder] = useState<PaymentHistorySortOrder>('desc')

    const history = usePaymentHistoryList({
        query,
        commitmentId,
        status,
        fromDate,
        toDate,
        sortBy,
        sortOrder
    })

    return <section className="page-wrap history-page">
        <div className="page-heading">
            <div>
                <div className="eyebrow">REGISTRO IMPEGNI</div>
                <h1>Cronologia</h1>
                <p>Registro pagamenti e salti degli impegni.</p>
            </div>
        </div>

        <div className="stats-grid history-stats">
            <div className="stat-card"><div className="stat-icon"><Filter size={16} /></div><div className="stat-label">Record visibili</div><div className="stat-value">{history.totals.totalCount}</div><div className="stat-hint">Filtri correnti applicati</div></div>
            <div className="stat-card"><div className="stat-icon"><Check size={16} /></div><div className="stat-label">Pagamenti registrati</div><div className="stat-value">{history.totals.paidCount}</div><div className="stat-hint">Totale pagato {formatCurrency(history.totals.paidAmountCents, 'EUR')}</div></div>
            <div className="stat-card"><div className="stat-icon"><RotateCcw size={16} /></div><div className="stat-label">Scadenze saltate</div><div className="stat-value">{history.totals.skippedCount}</div><div className="stat-hint">Importi non conteggiati nei pagati</div></div>
        </div>

        <div className="toolbar history-toolbar">
            <div className="search-box"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca per impegno, nota o data..." /></div>
            <div className="filter-box"><Filter size={16} />
                <select value={commitmentId} onChange={event => setCommitmentId(event.target.value)}>
                    <option value="all">Tutti gli impegni</option>
                    {history.commitmentOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
            </div>
            <div className="filter-box"><Filter size={16} />
                <select value={status} onChange={event => setStatus(event.target.value as PaymentHistoryStatus | 'all')}>
                    <option value="all">Tutti gli stati</option>
                    <option value="paid">Pagato</option>
                    <option value="skipped">Saltato</option>
                </select>
            </div>
            <label className="filter-box date-filter"><span>Dal</span><input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} /></label>
            <label className="filter-box date-filter"><span>Al</span><input type="date" value={toDate} onChange={event => setToDate(event.target.value)} /></label>
            <div className="filter-box"><Filter size={16} />
                <select value={sortBy} onChange={event => setSortBy(event.target.value as PaymentHistorySortBy)}>
                    <option value="actionDate">Ordina per data azione</option>
                    <option value="dueDate">Ordina per data scadenza</option>
                    <option value="amountCents">Ordina per importo</option>
                    <option value="title">Ordina per impegno</option>
                    <option value="status">Ordina per stato</option>
                </select>
            </div>
            <div className="filter-box"><Filter size={16} />
                <select value={sortOrder} onChange={event => setSortOrder(event.target.value as PaymentHistorySortOrder)}>
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                </select>
            </div>
        </div>

        {history.error && <div className="panel commitments-error">Errore caricamento cronologia: {history.error}</div>}

        {!history.error && <section className="panel history-panel history-panel-modern">
            {history.rows.length ? <div className="history-list history-list-modern">{history.rows.map(row => <article className="history-row history-row-modern" key={row.id}>
                <div className={`history-check ${row.status === 'paid' ? 'paid' : 'skipped'}`}>{row.status === 'paid' ? <Check size={14} /> : <RotateCcw size={14} />}</div>
                <div className="history-info history-info-modern">
                    <div className="history-title-line"><b>{row.commitmentTitle}</b><span className={`status ${row.status === 'paid' ? 'active' : 'paused'}`}>{statusLabel[row.status]}</span></div>
                    <span>Scadenza {dateLabel(row.dueDate)} · Azione {dateLabel(row.actionDate)}</span>
                    {row.note && <small>{row.note}</small>}
                    {row.commitmentMissing && <small className="history-missing">Riferimento impegno non piu disponibile</small>}
                </div>
                <strong>{row.status === 'paid' ? formatCurrency(row.amountCents, row.currency) : '—'}</strong>
            </article>)}</div> : <EmptyState title={history.loading ? 'Caricamento cronologia' : 'Cronologia vuota'} text={history.loading ? 'Caricamento in corso.' : 'Nessun record corrisponde ai filtri selezionati.'} />}
        </section>}
    </section>
}
