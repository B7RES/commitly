import type { TermFrequency } from '../types/index'

function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } {
    const [year, month, day] = isoDate.split('-').map(Number)
    return { year, month, day }
}

function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
}

export function addDaysIso(isoDate: string, dayOffset: number): string {
    const { year, month, day } = parseIsoDateParts(isoDate)
    const date = new Date(year, month - 1, day + dayOffset, 12)
    return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function addMonthsAnchored(isoDate: string, monthOffset: number, anchorDay?: number): string {
    const { year, month, day } = parseIsoDateParts(isoDate)
    const anchor = anchorDay ?? day
    const monthIndex = month - 1 + monthOffset
    const targetYear = year + Math.floor(monthIndex / 12)
    const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12
    const targetMonth = normalizedMonthIndex + 1
    const targetDay = Math.min(anchor, daysInMonth(targetYear, targetMonth))
    return toIsoDate(targetYear, targetMonth, targetDay)
}

function addYearAnchored(isoDate: string, anchorDay?: number, monthOfYear?: number): string {
    const { year, month, day } = parseIsoDateParts(isoDate)
    const targetYear = year + 1
    const targetMonth = monthOfYear ?? month
    const anchor = anchorDay ?? day
    const targetDay = Math.min(anchor, daysInMonth(targetYear, targetMonth))
    return toIsoDate(targetYear, targetMonth, targetDay)
}

export function addFrequencyAnchored(
    isoDate: string,
    frequency: TermFrequency,
    anchorDay?: number,
    monthOfYear?: number
): string {
    if (frequency === 'weekly') return addDaysIso(isoDate, 7)
    if (frequency === 'monthly') return addMonthsAnchored(isoDate, 1, anchorDay)
    if (frequency === 'quarterly') return addMonthsAnchored(isoDate, 3, anchorDay)
    if (frequency === 'yearly') return addYearAnchored(isoDate, anchorDay, monthOfYear)
    return isoDate
}
