import { useMemo } from 'react'
import { Activity, CalendarDays, ChevronRight, CreditCard, ShieldCheck, Wallet } from 'lucide-react'
import { dateLabel, dueLabel, money } from '../../lib/utils'
import { EmptyState, PaymentIcon, StatCard, type PaymentIconKind } from '../../components/shared'
import { useDashboardSummary } from '../../hooks/useDashboardSummary'

const commitmentTypeToKind: Record<'subscription' | 'recurring' | 'financing', PaymentIconKind> = {
    subscription: 'subscription',
    recurring: 'other',
    financing: 'financing'
}

function moneyFromCents(valueCents: number): string {
    return money(valueCents / 100)
}

interface DashboardPageProps {
    onGoToPayments: () => void
}

export function DashboardPage({ onGoToPayments }: DashboardPageProps) {
    const dashboard = useDashboardSummary()

    const financingResidual = useMemo(() => {
        const financingItems = dashboard.residualDebt.items.filter(item => item.type === 'financing')
        const determinableTotalCents = financingItems
            .filter(item => item.residualDebtCents !== null)
            .reduce((sum, item) => sum + (item.residualDebtCents ?? 0), 0)
        const undeterminedCount = financingItems.filter(item => item.residualDebtCents === null).length
        return { financingItems, determinableTotalCents, undeterminedCount }
    }, [dashboard.residualDebt.items])

    return <section className="page-wrap">
        <div className="page-heading"><div><div className="eyebrow">IL TUO QUADRO GENERALE</div><h1>Panoramica</h1><p>Controlla abbonamenti, rate e prossime scadenze.</p></div><div className="today-chip"><CalendarDays size={15} />{new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date())}</div></div>
        <div className="stats-grid">
            <StatCard icon={<Wallet size={18} />} label="Impegno mensile" value={moneyFromCents(dashboard.monthlyEquivalentCents)} hint="Equivalente mensile sugli impegni attivi" />
            <StatCard icon={<CreditCard size={18} />} label="Impegni attivi" value={String(dashboard.statusTotals.active)} hint={`${dashboard.upcoming.length} scadenze prossime`} />
            <StatCard icon={<Activity size={18} />} label="Impegni in pausa" value={String(dashboard.statusTotals.paused)} hint="Temporaneamente sospesi" />
            <StatCard icon={<CalendarDays size={18} />} label="Impegni archiviati" value={String(dashboard.statusTotals.archived)} hint="Non più in esecuzione" accent />
        </div>
        <div className="dashboard-grid">
            <section className="panel upcoming-panel"><div className="panel-heading"><div><h2>Prossime scadenze</h2><p>Scadenze generate dai termini degli impegni</p></div><button className="text-btn" onClick={onGoToPayments}>Vedi tutti <ChevronRight size={15} /></button></div>
                {dashboard.loading ? <div className="empty-mini">Caricamento riepilogo in corso...</div> : dashboard.error ? <div className="empty-mini">Errore nel caricamento: {dashboard.error}</div> : dashboard.upcoming.length ? <div className="upcoming-list">{dashboard.upcoming.slice(0, 5).map(item => { const kind = commitmentTypeToKind[item.type]; return <div className="upcoming-row" key={`${item.commitmentId}-${item.dueDate}-${item.amountCents}`}><div className={`payment-icon ${kind}`}><PaymentIcon kind={kind} /></div><div className="upcoming-info"><b>{item.title}</b><span>{dateLabel(item.dueDate)} · {dueLabel(item.dueDate)}</span></div><div className="upcoming-amount">{moneyFromCents(item.amountCents)}<small>{item.category}</small></div></div> })}</div> : <EmptyState title="Nessuna scadenza" text="Nessun impegno attivo con scadenze imminenti." />}
            </section>
            <section className="panel breakdown-panel"><div className="panel-heading"><div><h2>Debito residuo</h2><p>Solo impegni di tipo finanziamento</p></div><div className="panel-icon"><Activity size={17} /></div></div>
                {dashboard.loading ? <div className="empty-mini">Calcolo del debito residuo in corso...</div> : dashboard.error ? <div className="empty-mini">Impossibile calcolare il debito residuo.</div> : financingResidual.financingItems.length ? <div className="breakdown-list">{financingResidual.financingItems.map(item => <div className="breakdown-item" key={item.commitmentId}><div className="breakdown-label"><span>{item.title}</span><b>{item.residualDebtCents === null ? 'Non determinabile' : moneyFromCents(item.residualDebtCents)}</b></div><div className="bar-track"><div className="bar-fill financing" style={{ width: item.residualDebtCents === null ? '8%' : '100%' }} /></div></div>)}<div className="breakdown-total"><span>Totale determinabile</span><b>{moneyFromCents(financingResidual.determinableTotalCents)}</b></div><div className="breakdown-total"><span>Valori non determinabili</span><b>{String(financingResidual.undeterminedCount)}</b></div></div> : <div className="empty-mini">Nessun finanziamento disponibile per il calcolo del debito residuo.</div>}
            </section>
        </div>
        <div className="bottom-note"><ShieldCheck size={16} /><span>Esporta periodicamente un backup dalle impostazioni.</span></div>
    </section>
}
