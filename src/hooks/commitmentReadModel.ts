import type { Commitment, CommitmentStatus, CommitmentTerm, PaymentHistory } from '../types/index'
import type { CommitmentWithTerms } from '../services/commitmentService'
import { addDaysIso } from '../services/domainDate'
import { generateTermDueDatesInRange, monthlyEquivalentCents } from '../services/commitmentCalculations'

export interface TermOccurrence {
    commitmentId: string
    termId: string
    dueDate: string
    amountCents: number
}

export function toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function monthBounds(month: Date): { start: string; end: string } {
    return {
        start: toIsoDate(new Date(month.getFullYear(), month.getMonth(), 1)),
        end: toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0))
    }
}

export function statusMatchesFilter(status: CommitmentStatus, filter: CommitmentStatus | 'all'): boolean {
    if (filter === 'all') return true
    return status === filter
}

export function resolveTermAtDate(terms: CommitmentTerm[], dateIso: string): CommitmentTerm | null {
    const sorted = [...terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
    const exact = sorted.find(term => term.validFrom <= dateIso && (term.validTo === undefined || term.validTo >= dateIso))
    if (exact) return exact

    const pastTerms = sorted.filter(term => term.validFrom <= dateIso)
    if (!pastTerms.length) return null
    return pastTerms[pastTerms.length - 1]
}

export function resolveMonthlyEquivalentCents(terms: CommitmentTerm[], dateIso: string): number {
    const currentTerm = resolveTermAtDate(terms, dateIso)
    if (!currentTerm) return 0
    return monthlyEquivalentCents(currentTerm)
}

export function buildOccurrencesForTerms(
    commitmentId: string,
    terms: CommitmentTerm[],
    startIso: string,
    endIso: string
): TermOccurrence[] {
    const occurrences: TermOccurrence[] = []

    for (const term of terms) {
        const dueDates = generateTermDueDatesInRange(term, startIso, endIso)
        for (const dueDate of dueDates) {
            occurrences.push({
                commitmentId,
                termId: term.id,
                dueDate,
                amountCents: term.amountCents
            })
        }
    }

    return occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.termId.localeCompare(b.termId))
}

export function resolveNextDueDate(terms: CommitmentTerm[], fromIso: string, lookAheadDays = 730): string | null {
    const endIso = addDaysIso(fromIso, lookAheadDays)
    let next: string | null = null

    for (const term of terms) {
        const dueDates = generateTermDueDatesInRange(term, fromIso, endIso)
        for (const dueDate of dueDates) {
            if (!next || dueDate < next) next = dueDate
        }
    }

    return next
}

export function mapByCommitment<T extends { commitmentId: string }>(items: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>()
    for (const item of items) {
        const existing = grouped.get(item.commitmentId)
        if (existing) existing.push(item)
        else grouped.set(item.commitmentId, [item])
    }
    return grouped
}

export function mapHistoryByCommitment(items: PaymentHistory[]): Map<string, PaymentHistory[]> {
    return mapByCommitment(items)
}

export function normalizeError(error: unknown): string {
    if (error instanceof Error) return error.message
    return 'Unknown error'
}

export function sortCommitmentsByUpdated(items: CommitmentWithTerms[], order: 'asc' | 'desc'): CommitmentWithTerms[] {
    return [...items].sort((a, b) => {
        const diff = a.commitment.updatedAt.localeCompare(b.commitment.updatedAt)
        return order === 'asc' ? diff : -diff
    })
}

export function sortCommitmentsByTitle(items: CommitmentWithTerms[], order: 'asc' | 'desc'): CommitmentWithTerms[] {
    return [...items].sort((a, b) => {
        const diff = a.commitment.title.localeCompare(b.commitment.title)
        return order === 'asc' ? diff : -diff
    })
}

export function sortCommitmentsByNextDue(
    items: CommitmentWithTerms[],
    order: 'asc' | 'desc',
    fromIso: string
): CommitmentWithTerms[] {
    return [...items].sort((a, b) => {
        const aDue = resolveNextDueDate(a.terms, fromIso) ?? '9999-12-31'
        const bDue = resolveNextDueDate(b.terms, fromIso) ?? '9999-12-31'
        const diff = aDue.localeCompare(bDue)
        return order === 'asc' ? diff : -diff
    })
}

export function sortCommitmentsByMonthlyEquivalent(
    items: CommitmentWithTerms[],
    order: 'asc' | 'desc',
    dateIso: string
): CommitmentWithTerms[] {
    return [...items].sort((a, b) => {
        const aValue = resolveMonthlyEquivalentCents(a.terms, dateIso)
        const bValue = resolveMonthlyEquivalentCents(b.terms, dateIso)
        const diff = aValue - bValue
        return order === 'asc' ? diff : -diff
    })
}

export function commitmentTitle(commitment: Commitment): string {
    return `${commitment.title} ${commitment.category}`.toLowerCase()
}
