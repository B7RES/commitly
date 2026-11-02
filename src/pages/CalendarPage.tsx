import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react'
import type { CommitmentType } from '../types/index'
import { dateLabel, money } from '../lib/utils'
import { EmptyState, PaymentIcon, type PaymentIconKind } from '../components/shared'
import { useCalendarSchedule } from '../hooks/useCalendarSchedule'

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const monthTitle = (date: Date) => new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(date)
const weekdayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const commitmentTypeToKind: Record<CommitmentType, PaymentIconKind> = {
  subscription: 'subscription',
  financing: 'financing',
  recurring: 'other'
}

export function CalendarPage({ onOpenCommitment, onAddPayment }: { onOpenCommitment: (commitmentId: string) => void; onAddPayment: () => void }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => iso(new Date()))
  const schedule = useCalendarSchedule(month)
  const occurrences = schedule.items
  const byDate = schedule.byDate
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const selected = byDate[selectedDate] ?? []
  const monthTotal = schedule.monthTotalCents / 100
  const paidCount = useMemo(() => occurrences.filter(item => item.scheduleStatus === 'paid').length, [occurrences])
  const skippedCount = useMemo(() => occurrences.filter(item => item.scheduleStatus === 'skipped').length, [occurrences])
  const pendingCount = useMemo(() => occurrences.filter(item => item.scheduleStatus === 'pending').length, [occurrences])
  const goMonth = (delta: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1))

  return <section className="page-wrap calendar-page">
    <div className="page-heading"><div><div className="eyebrow">SCADENZE</div><h1>Calendario</h1><p>Visualizza le prossime rate e i pagamenti ricorrenti.</p></div><button className="primary-btn" onClick={onAddPayment}><Plus size={17} /> Nuovo impegno</button></div>
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar"><button className="icon-btn" onClick={() => goMonth(-1)} aria-label="Mese precedente"><ChevronLeft size={18} /></button><h2>{monthTitle(month)}</h2><button className="icon-btn" onClick={() => goMonth(1)} aria-label="Mese successivo"><ChevronRight size={18} /></button><button className="secondary-btn calendar-today" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(iso(now)) }}>Oggi</button></div>
        <div className="calendar-grid calendar-weekdays">{weekdayNames.map(day => <div key={day}>{day}</div>)}</div>
        <div className="calendar-grid calendar-days">{cells.map((day, index) => {
          if (!day) return <div className="calendar-day empty" key={`empty-${index}`} />
          const date = iso(new Date(month.getFullYear(), month.getMonth(), day))
          const items = byDate[date] ?? []
          const isToday = date === iso(new Date())
          return <button key={date} className={`calendar-day ${selectedDate === date ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(date)}>
            <span className="day-number">{day}</span>
            {items.length > 0 && <span className="day-dots">{items.slice(0, 4).map((item, i) => <i key={`${item.commitmentId}-${date}-${i}`} className={`dot ${commitmentTypeToKind[item.commitmentType]}`} />)}</span>}
            {items.length > 1 && <small>{items.length}</small>}
          </button>
        })}</div>
        <div className="calendar-legend"><span><i className="dot subscription" /> Abbonamenti</span><span><i className="dot financing" /> Finanziamenti</span><span><i className="dot bill" /> Utenze</span><span><i className="dot other" /> Altro</span></div>
      </section>
      <aside className="panel calendar-detail"><div className="panel-heading"><div><h2>{dateLabel(selectedDate)}</h2><p>{selected.length ? `${selected.length} ${selected.length === 1 ? 'pagamento previsto' : 'pagamenti previsti'}` : 'Nessuna scadenza'}</p></div><div className="panel-icon"><CalendarDays size={17} /></div></div>
        {selected.length ? <><div className="calendar-event-list">{selected.map(item => {
          const kind = commitmentTypeToKind[item.commitmentType]
          const statusLabel = item.scheduleStatus === 'paid' ? 'Pagato' : item.scheduleStatus === 'skipped' ? 'Saltato' : 'Da pagare'
          return <button className="calendar-event" key={`${item.commitmentId}-${item.dueDate}`} onClick={() => onOpenCommitment(item.commitmentId)}><span className={`payment-icon ${kind}`}><PaymentIcon kind={kind} /></span><span className="calendar-event-info"><b>{item.title}</b><small>{item.category} · {statusLabel}</small></span><strong>{money(item.amountCents / 100)}</strong>{item.scheduleStatus === 'paid' && <Check size={14} />}{item.scheduleStatus === 'skipped' && <RotateCcw size={14} />}</button>
        })}</div><div className="calendar-day-total"><span>Totale del giorno</span><b>{money(selected.reduce((sum, item) => sum + (item.amountCents / 100), 0))}</b></div></> : <div className="calendar-empty"><span>{schedule.loading ? 'Caricamento calendario in corso...' : schedule.error ? `Errore: ${schedule.error}` : 'Nessun pagamento previsto per questa data.'}</span><button className="text-btn" onClick={onAddPayment}>Crea un impegno <ChevronRight size={15} /></button></div>}
      </aside>
    </div>
    <div className="calendar-month-summary"><span>Totale previsto nel mese</span><strong>{money(monthTotal)}</strong><small>{occurrences.length} scadenze · {paidCount} pagate · {skippedCount} saltate · {pendingCount} da gestire</small></div>
    {!schedule.loading && !schedule.error && !occurrences.length && <div className="calendar-empty-state"><EmptyState title="Il calendario è vuoto" text="Aggiungi un abbonamento o un finanziamento per visualizzare le scadenze." action={onAddPayment} /></div>}
  </section>
}
