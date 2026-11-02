import type { CommitmentTerm, PaymentHistory } from '../types/index'
import { addFrequencyAnchored } from './domainDate'

interface ScheduledInstallment {
    dueDate: string
    amountCents: number
}

export function monthlyEquivalentCents(term: CommitmentTerm): number {
    if (term.frequency === 'weekly') return Math.round(term.amountCents * 52 / 12)
    if (term.frequency === 'monthly') return term.amountCents
    if (term.frequency === 'quarterly') return Math.round(term.amountCents / 3)
    if (term.frequency === 'yearly') return Math.round(term.amountCents / 12)
    return 0
}

export function paidInstallmentsCount(history: PaymentHistory[]): number {
    return history.filter(entry => entry.status === 'paid' && entry.amountCents > 0).length
}

export function remainingInstallmentsCount(term: CommitmentTerm, history: PaymentHistory[]): number | null {
    if (term.installmentTotal === undefined) return null
    return Math.max(0, term.installmentTotal - paidInstallmentsCount(history))
}

function resolveInstallmentTotal(terms: CommitmentTerm[]): number | null {
    const totals = new Set(terms
        .map(term => term.installmentTotal)
        .filter((value): value is number => value !== undefined))

    if (totals.size === 0) return null
    if (totals.size > 1) return null
    return Array.from(totals)[0]
}

function buildInstallmentPlan(terms: CommitmentTerm[], totalInstallments: number): ScheduledInstallment[] | null {
    const sortedTerms = [...terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
    const plan: ScheduledInstallment[] = []
    const seenDates = new Set<string>()
    const guardLimit = 10000
    let guard = 0

    for (const term of sortedTerms) {
        if (plan.length >= totalInstallments) break

        const end = term.validTo ?? '9999-12-31'
        let cursor = term.validFrom

        if (term.frequency === 'once') {
            if (cursor <= end) {
                if (seenDates.has(cursor)) return null
                plan.push({ dueDate: cursor, amountCents: term.amountCents })
                seenDates.add(cursor)
            }
            continue
        }

        while (cursor <= end && plan.length < totalInstallments && guard++ < guardLimit) {
            if (seenDates.has(cursor)) return null
            plan.push({ dueDate: cursor, amountCents: term.amountCents })
            seenDates.add(cursor)
            cursor = addFrequencyAnchored(cursor, term.frequency, term.anchorDay ?? term.dayOfMonth, term.monthOfYear)
        }
    }

    if (plan.length < totalInstallments) return null
    return plan.slice(0, totalInstallments)
}

export function residualDebtCents(terms: CommitmentTerm[], history: PaymentHistory[]): number | null {
    const totalInstallments = resolveInstallmentTotal(terms)
    if (totalInstallments === null) return null

    const plan = buildInstallmentPlan(terms, totalInstallments)
    if (!plan) return null

    const paidDueDates = new Set(
        history
            .filter(entry => entry.status === 'paid' && entry.amountCents > 0)
            .map(entry => entry.dueDate)
    )

    const planDates = new Set(plan.map(entry => entry.dueDate))
    for (const dueDate of paidDueDates) {
        if (!planDates.has(dueDate)) return null
    }

    return plan
        .filter(entry => !paidDueDates.has(entry.dueDate))
        .reduce((sum, entry) => sum + entry.amountCents, 0)
}

export function generateTermDueDatesInRange(term: CommitmentTerm, startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const rangeStart = startDate > term.validFrom ? startDate : term.validFrom
    const rangeEnd = term.validTo && term.validTo < endDate ? term.validTo : endDate

    if (term.frequency === 'once') {
        if (term.validFrom >= rangeStart && term.validFrom <= rangeEnd) dates.push(term.validFrom)
        return dates
    }

    let cursor = term.validFrom
    const guardLimit = 2400
    let guard = 0

    while (cursor < rangeStart && guard++ < guardLimit) {
        cursor = addFrequencyAnchored(cursor, term.frequency, term.anchorDay ?? term.dayOfMonth, term.monthOfYear)
    }

    while (cursor <= rangeEnd && guard++ < guardLimit) {
        dates.push(cursor)
        cursor = addFrequencyAnchored(cursor, term.frequency, term.anchorDay ?? term.dayOfMonth, term.monthOfYear)
    }

    return dates
}
