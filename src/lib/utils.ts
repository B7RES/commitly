export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const money = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0)
export const dateLabel = (value: string) => value ? new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '—'
export function dueLabel(date: string): string {
  if (!date) return 'Data da definire'
  const diff = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${todayISO()}T12:00:00`).getTime()) / 86400000)
  if (diff < 0) return `Scaduto da ${Math.abs(diff)} gg`
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Domani'
  if (diff <= 30) return `Tra ${diff} giorni`
  return dateLabel(date)
}
