import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/shared'
import { createCommitment, getCommitmentWithTerms, updateCommitment } from '../../services/commitmentService'
import { addCommitmentTerm, addOrReplaceCurrentCommitmentTerm } from '../../services/commitmentTermService'
import type { CommitmentTerm, CommitmentType, TermFrequency } from '../../types/index'

const commitmentTypeOptions: Array<{ value: CommitmentType; label: string }> = [
    { value: 'subscription', label: 'Abbonamento' },
    { value: 'recurring', label: 'Ricorrente' },
    { value: 'financing', label: 'Finanziamento' }
]

const frequencyOptions: Array<{ value: TermFrequency; label: string }> = [
    { value: 'weekly', label: 'Settimanale' },
    { value: 'monthly', label: 'Mensile' },
    { value: 'quarterly', label: 'Trimestrale' },
    { value: 'yearly', label: 'Annuale' },
    { value: 'once', label: 'Una tantum' }
]

const categories = ['Streaming', 'Software', 'Telefono e internet', 'Casa e utenze', 'Auto', 'Finanziamenti', 'Assicurazioni', 'Palestra e sport', 'Altro']

interface CommitmentFormState {
    name: string
    type: CommitmentType
    category: string
    notes: string
    startDate: string
    currency: string
    amount: string
    frequency: TermFrequency
    firstDueDate: string
    endDate: string
    installmentsTotal: string
    installmentAmount: string
    firstInstallmentDate: string
}

interface FormPayload {
    title: string
    type: CommitmentType
    category: string
    notes?: string
    startDate: string
    endDate?: string
    currency: string
    amountCents: number
    frequency: TermFrequency
    firstDueDate: string
    installmentTotal?: number
}

interface FormErrors {
    name?: string
    category?: string
    startDate?: string
    currency?: string
    amount?: string
    frequency?: string
    firstDueDate?: string
    endDate?: string
    installmentsTotal?: string
    installmentAmount?: string
    firstInstallmentDate?: string
}

interface CommitmentEditorPageProps {
    mode: 'create' | 'edit'
    commitmentId?: string
}

function todayIso(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseIsoDay(isoDate: string): number | undefined {
    const day = Number(isoDate.split('-')[2])
    if (!Number.isFinite(day) || day < 1 || day > 31) return undefined
    return day
}

function parseIsoMonth(isoDate: string): number | undefined {
    const month = Number(isoDate.split('-')[1])
    if (!Number.isFinite(month) || month < 1 || month > 12) return undefined
    return month
}

function isoDateLike(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function blankFormState(): CommitmentFormState {
    const today = todayIso()
    return {
        name: '',
        type: 'subscription',
        category: 'Streaming',
        notes: '',
        startDate: today,
        currency: 'EUR',
        amount: '',
        frequency: 'monthly',
        firstDueDate: today,
        endDate: '',
        installmentsTotal: '',
        installmentAmount: '',
        firstInstallmentDate: today
    }
}

function centsToInput(value: number): string {
    return (value / 100).toFixed(2)
}

function amountToCents(value: string): number | null {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) return null
    const cents = Math.round(parsed * 100)
    if (cents <= 0) return null
    return cents
}

function formFromRecord(data: NonNullable<Awaited<ReturnType<typeof getCommitmentWithTerms>>>): CommitmentFormState {
    const latestTerm = [...data.terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).at(-1)
    const isFinancing = data.commitment.type === 'financing'
    const amount = latestTerm ? centsToInput(latestTerm.amountCents) : ''
    const firstDueDate = latestTerm?.validFrom ?? data.commitment.startDate

    return {
        name: data.commitment.title,
        type: data.commitment.type,
        category: data.commitment.category,
        notes: data.commitment.notes ?? '',
        startDate: data.commitment.startDate,
        currency: data.commitment.currency || 'EUR',
        amount,
        frequency: latestTerm?.frequency ?? 'monthly',
        firstDueDate,
        endDate: latestTerm?.validTo ?? data.commitment.endDate ?? '',
        installmentsTotal: latestTerm?.installmentTotal ? String(latestTerm.installmentTotal) : '',
        installmentAmount: isFinancing ? amount : '',
        firstInstallmentDate: isFinancing ? firstDueDate : todayIso()
    }
}

function buildTermComparable(payload: FormPayload): string {
    return JSON.stringify({
        amountCents: payload.amountCents,
        frequency: payload.frequency,
        firstDueDate: payload.firstDueDate,
        endDate: payload.endDate ?? null,
        installmentTotal: payload.installmentTotal ?? null
    })
}

function termComparableFromTerm(term: CommitmentTerm): string {
    return JSON.stringify({
        amountCents: term.amountCents,
        frequency: term.frequency,
        firstDueDate: term.validFrom,
        endDate: term.validTo ?? null,
        installmentTotal: term.installmentTotal ?? null
    })
}

function validateForm(form: CommitmentFormState): { payload?: FormPayload; errors: FormErrors } {
    const errors: FormErrors = {}

    const title = form.name.trim()
    if (!title) errors.name = 'Inserisci il nome dell\'impegno.'

    const category = form.category.trim()
    if (!category) errors.category = 'Seleziona una categoria.'

    const startDate = form.startDate.trim()
    if (!isoDateLike(startDate)) errors.startDate = 'Inserisci una data di inizio valida.'

    const currency = form.currency.trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) errors.currency = 'Usa un codice valuta a 3 lettere (es. EUR).'

    const firstDueDateRaw = form.type === 'financing' ? form.firstInstallmentDate.trim() : form.firstDueDate.trim()
    if (!isoDateLike(firstDueDateRaw)) errors.firstDueDate = 'Inserisci una prima scadenza valida.'

    const amountRaw = form.type === 'financing' ? form.installmentAmount : form.amount
    const amountCents = amountToCents(amountRaw)
    if (amountCents === null) {
        if (form.type === 'financing') errors.installmentAmount = 'Inserisci un importo rata valido (> 0).'
        else errors.amount = 'Inserisci un importo valido (> 0).'
    }

    let installmentTotal: number | undefined
    if (form.type === 'financing') {
        if (!isoDateLike(form.firstInstallmentDate.trim())) {
            errors.firstInstallmentDate = 'Inserisci una data prima rata valida.'
        }

        const parsedTotal = Number(form.installmentsTotal)
        if (!Number.isInteger(parsedTotal) || parsedTotal < 1) {
            errors.installmentsTotal = 'Inserisci un numero rate intero maggiore di zero.'
        } else {
            installmentTotal = parsedTotal
        }
    }

    const normalizedEndDate = form.endDate.trim()
    if (normalizedEndDate && !isoDateLike(normalizedEndDate)) {
        errors.endDate = 'Inserisci una data fine valida o lascia vuoto.'
    }

    if (!errors.startDate && !errors.firstDueDate && startDate > firstDueDateRaw) {
        errors.firstDueDate = 'La prima scadenza non puo essere prima della data di inizio.'
    }

    if (normalizedEndDate && !errors.endDate) {
        if (!errors.startDate && normalizedEndDate < startDate) {
            errors.endDate = 'La data fine non puo essere prima della data di inizio.'
        }
        if (!errors.firstDueDate && normalizedEndDate < firstDueDateRaw) {
            errors.endDate = 'La data fine non puo essere prima della prima scadenza.'
        }
    }

    if (Object.keys(errors).length > 0 || amountCents === null) {
        return { errors }
    }

    return {
        errors,
        payload: {
            title,
            type: form.type,
            category,
            notes: form.notes.trim() || undefined,
            startDate,
            endDate: normalizedEndDate || undefined,
            currency,
            amountCents,
            frequency: form.frequency,
            firstDueDate: firstDueDateRaw,
            installmentTotal
        }
    }
}

function fieldError(errors: FormErrors, key: keyof FormErrors): string | null {
    return errors[key] ?? null
}

export function CommitmentEditorPage({ mode, commitmentId }: CommitmentEditorPageProps) {
    const navigate = useNavigate()
    const isEdit = mode === 'edit'

    const record = useLiveQuery(async () => {
        if (!isEdit || !commitmentId) return null
        return getCommitmentWithTerms(commitmentId)
    }, [isEdit, commitmentId])

    const [form, setForm] = useState<CommitmentFormState>(blankFormState)
    const [hydratedId, setHydratedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    useEffect(() => {
        if (!isEdit || !record) return
        if (hydratedId === record.commitment.id) return
        setForm(formFromRecord(record))
        setHydratedId(record.commitment.id)
    }, [hydratedId, isEdit, record])

    const latestTerm = useMemo(() => {
        if (!record) return undefined
        return [...record.terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).at(-1)
    }, [record])

    if (isEdit && record === undefined) {
        return <section className="page-wrap commitment-editor-page"><EmptyState title="Caricamento impegno" text="Sto preparando i dati per la modifica." /></section>
    }

    if (isEdit && !record) {
        return <section className="page-wrap commitment-editor-page"><EmptyState title="Impegno non trovato" text="Non posso modificare un impegno che non esiste o e stato rimosso." action={() => navigate('/commitments')} /></section>
    }

    const heading = isEdit ? 'Modifica impegno' : 'Nuovo impegno'
    const subtitle = isEdit ? 'Aggiorna i dati preservando storico e termini precedenti.' : 'Crea un impegno con termini e ricorrenze.'

    const setType = (nextType: CommitmentType) => {
        setForm(current => {
            if (nextType !== 'financing') {
                return {
                    ...current,
                    type: nextType,
                    category: current.category || 'Altro',
                    installmentAmount: '',
                    installmentsTotal: '',
                    firstInstallmentDate: current.firstDueDate
                }
            }

            const firstDate = current.firstDueDate || todayIso()
            return {
                ...current,
                type: nextType,
                category: current.category === 'Finanziamenti' || current.category ? current.category : 'Finanziamenti',
                installmentAmount: current.installmentAmount || current.amount,
                firstInstallmentDate: firstDate,
                firstDueDate: firstDate
            }
        })
    }

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setSubmitError(null)

        const validation = validateForm(form)
        setFormErrors(validation.errors)
        if (!validation.payload) return

        const payload = validation.payload
        setSaving(true)

        try {
            const id = commitmentId ?? crypto.randomUUID()

            if (isEdit) {
                await updateCommitment(id, {
                    type: payload.type,
                    title: payload.title,
                    category: payload.category,
                    notes: payload.notes,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    currency: payload.currency
                })

                if (latestTerm) {
                    const previousComparable = termComparableFromTerm(latestTerm)
                    const nextComparable = buildTermComparable(payload)

                    if (previousComparable !== nextComparable) {
                        if (payload.firstDueDate <= latestTerm.validFrom) {
                            setFormErrors({ firstDueDate: `La nuova prima scadenza deve essere successiva al termine attuale (${latestTerm.validFrom}).` })
                            setSaving(false)
                            return
                        }

                        await addOrReplaceCurrentCommitmentTerm({
                            id: crypto.randomUUID(),
                            commitmentId: id,
                            validFrom: payload.firstDueDate,
                            validTo: payload.endDate,
                            amountCents: payload.amountCents,
                            frequency: payload.frequency,
                            dayOfMonth: parseIsoDay(payload.firstDueDate),
                            anchorDay: parseIsoDay(payload.firstDueDate),
                            endOfMonthPolicy: payload.frequency === 'monthly' || payload.frequency === 'quarterly' ? 'clamp' : undefined,
                            monthOfYear: payload.frequency === 'yearly' ? parseIsoMonth(payload.firstDueDate) : undefined,
                            installmentTotal: payload.type === 'financing' ? payload.installmentTotal : undefined
                        })
                    }
                } else {
                    await addCommitmentTerm({
                        id: crypto.randomUUID(),
                        commitmentId: id,
                        validFrom: payload.firstDueDate,
                        validTo: payload.endDate,
                        amountCents: payload.amountCents,
                        frequency: payload.frequency,
                        dayOfMonth: parseIsoDay(payload.firstDueDate),
                        anchorDay: parseIsoDay(payload.firstDueDate),
                        endOfMonthPolicy: payload.frequency === 'monthly' || payload.frequency === 'quarterly' ? 'clamp' : undefined,
                        monthOfYear: payload.frequency === 'yearly' ? parseIsoMonth(payload.firstDueDate) : undefined,
                        installmentTotal: payload.type === 'financing' ? payload.installmentTotal : undefined,
                        allowGap: true
                    })
                }
            } else {
                await createCommitment({
                    id,
                    type: payload.type,
                    title: payload.title,
                    category: payload.category,
                    notes: payload.notes,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    currency: payload.currency,
                    status: 'active'
                })

                await addCommitmentTerm({
                    id: crypto.randomUUID(),
                    commitmentId: id,
                    validFrom: payload.firstDueDate,
                    validTo: payload.endDate,
                    amountCents: payload.amountCents,
                    frequency: payload.frequency,
                    dayOfMonth: parseIsoDay(payload.firstDueDate),
                    anchorDay: parseIsoDay(payload.firstDueDate),
                    endOfMonthPolicy: payload.frequency === 'monthly' || payload.frequency === 'quarterly' ? 'clamp' : undefined,
                    monthOfYear: payload.frequency === 'yearly' ? parseIsoMonth(payload.firstDueDate) : undefined,
                    installmentTotal: payload.type === 'financing' ? payload.installmentTotal : undefined,
                    allowGap: true
                })
            }

            navigate(`/commitments/${id}`, {
                state: {
                    flash: isEdit ? 'Impegno aggiornato con successo.' : 'Impegno creato con successo.'
                }
            })
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Errore sconosciuto durante il salvataggio.'
            setSubmitError(message)
        } finally {
            setSaving(false)
        }
    }

    const isFinancing = form.type === 'financing'

    return <section className="page-wrap commitment-editor-page">
        <div className="page-heading">
            <div>
                <div className="eyebrow">MODELLO IMPEGNI</div>
                <h1>{heading}</h1>
                <p>{subtitle}</p>
            </div>
            <Link className="secondary-btn" to={isEdit && commitmentId ? `/commitments/${commitmentId}` : '/commitments'}><ArrowLeft size={15} /> Annulla</Link>
        </div>

        <form className="panel commitment-form" noValidate onSubmit={event => { void onSubmit(event) }}>
            {submitError && <div className="commitment-form-alert">{submitError}</div>}

            <section className="commitment-form-section">
                <h2>Informazioni generali</h2>
                <div className="commitment-form-grid">
                    <label className="field full">
                        <span>Nome</span>
                        <input autoFocus required maxLength={80} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Es. Netflix, mutuo, palestra" />
                        {fieldError(formErrors, 'name') && <small className="field-error">{fieldError(formErrors, 'name')}</small>}
                    </label>

                    <label className="field">
                        <span>Tipo</span>
                        <select value={form.type} onChange={event => setType(event.target.value as CommitmentType)}>
                            {commitmentTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>

                    <label className="field">
                        <span>Categoria</span>
                        <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
                            {categories.map(category => <option key={category} value={category}>{category}</option>)}
                        </select>
                        {fieldError(formErrors, 'category') && <small className="field-error">{fieldError(formErrors, 'category')}</small>}
                    </label>

                    <label className="field">
                        <span>Data inizio</span>
                        <input required type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} />
                        {fieldError(formErrors, 'startDate') && <small className="field-error">{fieldError(formErrors, 'startDate')}</small>}
                    </label>

                    <label className="field">
                        <span>Valuta</span>
                        <input required maxLength={3} value={form.currency} onChange={event => setForm({ ...form, currency: event.target.value.toUpperCase() })} placeholder="EUR" />
                        {fieldError(formErrors, 'currency') && <small className="field-error">{fieldError(formErrors, 'currency')}</small>}
                    </label>

                    <label className="field full">
                        <span>Note (facoltative)</span>
                        <textarea rows={3} maxLength={500} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Dettagli aggiuntivi, condizioni, riferimenti..." />
                    </label>
                </div>
            </section>

            <section className="commitment-form-section">
                <h2>Termini di pagamento</h2>
                <div className="commitment-form-grid">
                    <label className="field">
                        <span>Importo</span>
                        <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={event => {
                            const amount = event.target.value
                            setForm(current => ({
                                ...current,
                                amount,
                                installmentAmount: current.type === 'financing' ? amount : current.installmentAmount
                            }))
                        }} placeholder="0,00" />
                        {fieldError(formErrors, 'amount') && <small className="field-error">{fieldError(formErrors, 'amount')}</small>}
                    </label>

                    <label className="field">
                        <span>Frequenza</span>
                        <select value={form.frequency} onChange={event => setForm({ ...form, frequency: event.target.value as TermFrequency })}>
                            {frequencyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {fieldError(formErrors, 'frequency') && <small className="field-error">{fieldError(formErrors, 'frequency')}</small>}
                    </label>

                    <label className="field">
                        <span>Prima scadenza</span>
                        <input required type="date" value={form.firstDueDate} onChange={event => {
                            const firstDueDate = event.target.value
                            setForm(current => ({
                                ...current,
                                firstDueDate,
                                firstInstallmentDate: current.type === 'financing' ? firstDueDate : current.firstInstallmentDate
                            }))
                        }} />
                        {fieldError(formErrors, 'firstDueDate') && <small className="field-error">{fieldError(formErrors, 'firstDueDate')}</small>}
                    </label>

                    <label className="field">
                        <span>Data fine (facoltativa)</span>
                        <input type="date" value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} />
                        {fieldError(formErrors, 'endDate') && <small className="field-error">{fieldError(formErrors, 'endDate')}</small>}
                    </label>
                </div>
            </section>

            {isFinancing && <section className="commitment-form-section">
                <h2>Dati finanziamento</h2>
                <div className="commitment-form-grid">
                    <label className="field">
                        <span>Numero totale rate</span>
                        <input required type="number" min="1" step="1" value={form.installmentsTotal} onChange={event => setForm({ ...form, installmentsTotal: event.target.value })} placeholder="Es. 24" />
                        {fieldError(formErrors, 'installmentsTotal') && <small className="field-error">{fieldError(formErrors, 'installmentsTotal')}</small>}
                    </label>

                    <label className="field">
                        <span>Importo rata</span>
                        <input required type="number" min="0.01" step="0.01" value={form.installmentAmount} onChange={event => {
                            const installmentAmount = event.target.value
                            setForm(current => ({
                                ...current,
                                installmentAmount,
                                amount: installmentAmount
                            }))
                        }} placeholder="0,00" />
                        {fieldError(formErrors, 'installmentAmount') && <small className="field-error">{fieldError(formErrors, 'installmentAmount')}</small>}
                    </label>

                    <label className="field">
                        <span>Data prima rata</span>
                        <input required type="date" value={form.firstInstallmentDate} onChange={event => {
                            const firstInstallmentDate = event.target.value
                            setForm(current => ({
                                ...current,
                                firstInstallmentDate,
                                firstDueDate: firstInstallmentDate
                            }))
                        }} />
                        {fieldError(formErrors, 'firstInstallmentDate') && <small className="field-error">{fieldError(formErrors, 'firstInstallmentDate')}</small>}
                    </label>
                </div>
            </section>}

            <div className="commitment-form-actions">
                <button type="button" className="secondary-btn" onClick={() => navigate(isEdit && commitmentId ? `/commitments/${commitmentId}` : '/commitments')}>
                    <ArrowLeft size={15} /> Annulla
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? <><Save size={15} /> Salvataggio...</> : <><Check size={15} /> {isEdit ? 'Salva modifiche' : 'Crea impegno'}</>}
                </button>
            </div>
        </form>
    </section>
}
