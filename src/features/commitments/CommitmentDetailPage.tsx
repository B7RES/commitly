import { useMemo, useState } from 'react'
import { ArrowLeft, CalendarClock, Check, Clock3, HandCoins, History, PauseCircle, Pencil, RotateCcw, WalletCards, X } from 'lucide-react'
import { EmptyState } from '../../components/shared'
import { useCommitmentDetail } from '../../hooks/useCommitmentDetail'
import { resolveTermAtDate, toIsoDate } from '../../hooks/commitmentReadModel'
import { addDaysIso } from '../../services/domainDate'
import { generateTermDueDatesInRange } from '../../services/commitmentCalculations'
import { registerPaidPayment, registerSkippedPayment } from '../../services/paymentHistoryService'
import type { CommitmentStatus, CommitmentType, PaymentHistoryStatus, TermFrequency } from '../../types/index'
import { dateLabel } from '../../lib/utils'

const typeLabels: Record<CommitmentType, string> = {
    subscription: 'Abbonamento',
    recurring: 'Ricorrente',
    financing: 'Finanziamento'
}

const statusLabels: Record<CommitmentStatus, string> = {
    active: 'Attivo',
    paused: 'In pausa',
    completed: 'Completato',
    archived: 'Archiviato'
}

const statusClassByValue: Record<CommitmentStatus, string> = {
    active: 'active',
    paused: 'paused',
    completed: 'completed',
    archived: 'archived'
}

const frequencyLabels: Record<TermFrequency, string> = {
    weekly: 'Settimanale',
    monthly: 'Mensile',
    quarterly: 'Trimestrale',
    yearly: 'Annuale',
    once: 'Una tantum'
}

const historyLabels: Record<PaymentHistoryStatus, string> = {
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

interface CommitmentDetailPageProps {
    commitmentId: string
    onBack: () => void
    onEdit: (commitmentId: string) => void
    onShowNotImplemented: (message: string) => void
}

export function CommitmentDetailPage({ commitmentId, onBack, onEdit, onShowNotImplemented }: CommitmentDetailPageProps) {
    const detail = useCommitmentDetail(commitmentId)
    const todayIso = toIsoDate(new Date())
    const [registeringDueDate, setRegisteringDueDate] = useState<string | null>(null)
    const [registeringMode, setRegisteringMode] = useState<'paid' | 'skipped'>('paid')
    const [registerAmount, setRegisterAmount] = useState('')
    const [registerActionDate, setRegisterActionDate] = useState(todayIso)
    const [registerNote, setRegisterNote] = useState('')
    const [registerError, setRegisterError] = useState<string | null>(null)
    const [savingRegistration, setSavingRegistration] = useState(false)

    const currentTerm = useMemo(() => {
        return resolveTermAtDate(detail.terms, todayIso)
    }, [detail.terms, todayIso])

    const upcomingSchedule = useMemo(() => {
        const endIso = addDaysIso(todayIso, 365)
        const dueDates = new Set<string>()

        for (const term of detail.terms) {
            const generated = generateTermDueDatesInRange(term, todayIso, endIso)
            for (const dueDate of generated) dueDates.add(dueDate)
        }

        return Array.from(dueDates)
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 12)
    }, [detail.terms, todayIso])

    const historyByDueDate = useMemo(() => {
        const map = new Map<string, { status: PaymentHistoryStatus; actionDate: string }>()
        for (const entry of detail.history) {
            const existing = map.get(entry.dueDate)
            if (!existing) {
                map.set(entry.dueDate, { status: entry.status, actionDate: entry.actionDate })
                continue
            }
            const shouldReplace = entry.actionDate > existing.actionDate
            if (shouldReplace) map.set(entry.dueDate, { status: entry.status, actionDate: entry.actionDate })
        }
        return map
    }, [detail.history])

    const openRegistration = (dueDate: string, mode: 'paid' | 'skipped', defaultAmountCents: number) => {
        setRegisteringDueDate(dueDate)
        setRegisteringMode(mode)
        setRegisterAmount((defaultAmountCents / 100).toFixed(2))
        setRegisterActionDate(todayIso)
        setRegisterNote('')
        setRegisterError(null)
    }

    const closeRegistration = () => {
        setRegisteringDueDate(null)
        setRegisterError(null)
        setSavingRegistration(false)
    }

    const submitRegistration = async () => {
        if (!registeringDueDate || !detail.commitment) return

        const actionDate = registerActionDate.trim()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(actionDate)) {
            setRegisterError('Inserisci una data pagamento valida.')
            return
        }

        setSavingRegistration(true)
        setRegisterError(null)

        try {
            if (registeringMode === 'paid') {
                const parsed = Number(registerAmount.replace(',', '.'))
                const cents = Math.round(parsed * 100)
                if (!Number.isFinite(parsed) || cents <= 0) {
                    setRegisterError('Inserisci un importo pagato valido (> 0).')
                    setSavingRegistration(false)
                    return
                }

                await registerPaidPayment({
                    id: crypto.randomUUID(),
                    commitmentId: detail.commitment.id,
                    dueDate: registeringDueDate,
                    actionDate,
                    amountCents: cents,
                    note: registerNote.trim() || undefined
                })
            } else {
                await registerSkippedPayment({
                    id: crypto.randomUUID(),
                    commitmentId: detail.commitment.id,
                    dueDate: registeringDueDate,
                    actionDate,
                    note: registerNote.trim() || undefined
                })
            }

            closeRegistration()
            onShowNotImplemented(registeringMode === 'paid' ? 'Pagamento registrato con successo.' : 'Scadenza segnata come saltata.')
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Errore durante la registrazione.'
            if (message.includes('Occurrence already registered')) {
                setRegisterError('Questa occorrenza risulta gia registrata. Non sono consentiti duplicati per la stessa scadenza.')
            } else {
                setRegisterError(message)
            }
        } finally {
            setSavingRegistration(false)
        }
    }

    const totalInstallments = currentTerm?.installmentTotal ?? null

    if (detail.loading) {
        return <section className="page-wrap commitment-detail-page"><EmptyState title="Caricamento impegno" text="Sto preparando il dettaglio dal database locale." /></section>
    }

    if (detail.error) {
        return <section className="page-wrap commitment-detail-page"><div className="panel commitments-error">Errore caricamento impegno: {detail.error}</div></section>
    }

    if (detail.missing || !detail.commitment) {
        return <section className="page-wrap commitment-detail-page"><EmptyState title="Impegno non trovato" text="L'impegno selezionato non esiste più o non è disponibile." action={onBack} /></section>
    }

    const { commitment } = detail
    const amountText = currentTerm ? formatCurrency(currentTerm.amountCents, commitment.currency) : 'Importo non disponibile'
    const frequencyText = currentTerm ? frequencyLabels[currentTerm.frequency] : 'Frequenza non disponibile'
    const nextDueText = detail.metrics.nextDueDate ? dateLabel(detail.metrics.nextDueDate) : 'Da definire'

    return <section className="page-wrap commitment-detail-page">
        <div className="page-heading commitment-detail-heading">
            <div>
                <button className="text-btn commitment-back" onClick={onBack}><ArrowLeft size={15} /> Torna a Impegni</button>
                <div className="eyebrow">DETTAGLIO IMPEGNO</div>
                <h1>{commitment.title}</h1>
                <p>{typeLabels[commitment.type]} · {commitment.category}</p>
            </div>
            <div className="detail-actions">
                <button className="secondary-btn" onClick={() => onEdit(commitmentId)}><Pencil size={15} /> Modifica</button>
                <button className="secondary-btn" onClick={() => onShowNotImplemented('Pausa disponibile nel prossimo step.')}><PauseCircle size={15} /> Pausa</button>
                <button className="secondary-btn" onClick={() => onShowNotImplemented('Archiviazione disponibile nel prossimo step.')}><WalletCards size={15} /> Archivia</button>
            </div>
        </div>

        <div className="stats-grid detail-stats">
            <div className="stat-card"><div className="stat-icon"><HandCoins size={16} /></div><div className="stat-label">Importo attuale</div><div className="stat-value detail-money">{amountText}</div><div className="stat-hint">Valuta {commitment.currency}</div></div>
            <div className="stat-card"><div className="stat-icon"><Clock3 size={16} /></div><div className="stat-label">Frequenza</div><div className="stat-value">{frequencyText}</div><div className="stat-hint">Stato <span className={`status ${statusClassByValue[commitment.status]}`}>{statusLabels[commitment.status]}</span></div></div>
            <div className="stat-card"><div className="stat-icon"><CalendarClock size={16} /></div><div className="stat-label">Prossima scadenza</div><div className="stat-value">{nextDueText}</div><div className="stat-hint">Generata dai termini dell'impegno</div></div>
        </div>

        <div className="detail-grid">
            <section className="panel detail-panel">
                <div className="panel-heading"><div><h2>Storico pagamenti</h2><p>Movimenti registrati per l'impegno</p></div><div className="panel-icon"><History size={17} /></div></div>
                {detail.history.length ? <div className="detail-history-list">{detail.history.map(entry => <div className="detail-history-row" key={entry.id}><div><b>{dateLabel(entry.dueDate)}</b><small>{historyLabels[entry.status]} · azione {dateLabel(entry.actionDate)}</small></div><div className="detail-history-side"><strong>{entry.status === 'paid' ? formatCurrency(entry.amountCents, commitment.currency) : '—'}</strong><span className={`status ${entry.status === 'paid' ? 'active' : 'paused'}`}>{historyLabels[entry.status]}</span></div></div>)}</div> : <div className="detail-empty">Nessuno storico disponibile per questo impegno.</div>}
            </section>

            <section className="panel detail-panel">
                <div className="panel-heading"><div><h2>Prossime scadenze</h2><p>Previsione prossimi 12 appuntamenti</p></div><div className="panel-icon"><CalendarClock size={17} /></div></div>
                {upcomingSchedule.length ? <div className="detail-upcoming-list">{upcomingSchedule.map(dueDate => {
                    const term = resolveTermAtDate(detail.terms, dueDate)
                    const amountCents = term?.amountCents ?? 0
                    const rowStatus = historyByDueDate.get(dueDate)?.status ?? 'pending'
                    const statusText = rowStatus === 'pending' ? 'Da registrare' : historyLabels[rowStatus]

                    return <div className="detail-upcoming-row-wrap" key={dueDate}>
                        <div className="detail-upcoming-row"><span>{dateLabel(dueDate)}</span><strong>{term ? formatCurrency(amountCents, commitment.currency) : '—'}</strong></div>
                        <div className="detail-upcoming-actions">
                            <span className={`status ${rowStatus === 'paid' ? 'active' : rowStatus === 'skipped' ? 'paused' : 'archived'}`}>{statusText}</span>
                            {rowStatus === 'pending' && <>
                                <button className="secondary-btn compact" onClick={() => openRegistration(dueDate, 'paid', amountCents)}><Check size={14} /> Segna pagato</button>
                                <button className="secondary-btn compact" onClick={() => openRegistration(dueDate, 'skipped', amountCents)}><RotateCcw size={14} /> Salta</button>
                            </>}
                        </div>

                        {registeringDueDate === dueDate && <div className="detail-register-panel">
                            <div className="detail-register-head">
                                <b>{registeringMode === 'paid' ? 'Registra pagamento' : 'Registra salto scadenza'}</b>
                                <button className="icon-btn compact" onClick={closeRegistration} aria-label="Chiudi registrazione"><X size={14} /></button>
                            </div>
                            {registeringMode === 'paid' && <label className="field"><span>Importo pagato</span><input type="number" min="0.01" step="0.01" value={registerAmount} onChange={event => setRegisterAmount(event.target.value)} /></label>}
                            <label className="field"><span>Data pagamento</span><input type="date" value={registerActionDate} onChange={event => setRegisterActionDate(event.target.value)} /></label>
                            <label className="field"><span>Nota (facoltativa)</span><input maxLength={160} value={registerNote} onChange={event => setRegisterNote(event.target.value)} placeholder="Es. saldo automatico, addebito manuale..." /></label>
                            {registerError && <div className="detail-register-error">{registerError}</div>}
                            <div className="detail-register-actions">
                                <button className="secondary-btn compact" onClick={closeRegistration}>Annulla</button>
                                <button className="primary-btn small" disabled={savingRegistration} onClick={() => { void submitRegistration() }}>{savingRegistration ? 'Salvataggio...' : 'Conferma'}</button>
                            </div>
                        </div>}
                    </div>
                })}</div> : <div className="detail-empty">Nessuna scadenza prevista nei prossimi 12 mesi.</div>}
            </section>
        </div>

        {commitment.type === 'financing' && <section className="panel detail-panel financing-panel">
            <div className="panel-heading"><div><h2>Metriche finanziamento</h2><p>Rate e debito residuo</p></div><div className="panel-icon"><HandCoins size={17} /></div></div>
            <div className="financing-grid">
                <div><span>Rate totali</span><b>{totalInstallments ?? 'Non definito'}</b></div>
                <div><span>Rate pagate</span><b>{detail.metrics.paidInstallments}</b></div>
                <div><span>Rate rimanenti</span><b>{detail.metrics.remainingInstallments ?? 'Non determinabile'}</b></div>
                <div><span>Debito residuo</span><b>{detail.metrics.residualDebtDeterminable ? formatCurrency(detail.metrics.residualDebtCents ?? 0, commitment.currency) : 'Non determinabile'}</b></div>
            </div>
        </section>}
    </section>
}
