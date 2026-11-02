import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/database'
import { listCommitmentsWithTerms, type CommitmentWithTerms } from '../services/commitmentService'
import type { CommitmentStatus, CommitmentType, PaymentHistory, PaymentHistoryStatus } from '../types/index'
import {
    buildOccurrencesForTerms,
    monthBounds,
    normalizeError,
    resolveTermAtDate,
    toIsoDate
} from './commitmentReadModel'

export interface CalendarScheduleItem {
    commitmentId: string
    commitmentType: CommitmentType
    title: string
    category: string
    status: CommitmentStatus
    dueDate: string
    amountCents: number
    scheduleStatus: 'pending' | PaymentHistoryStatus
}

interface CalendarQueryResult {
    commitments: CommitmentWithTerms[]
    history: PaymentHistory[]
    error: string | null
}

export interface UseCalendarScheduleOptions {
    includeStatuses?: CommitmentStatus[]
}

const defaultStatuses: CommitmentStatus[] = ['active']

export function useCalendarSchedule(month: Date, options: UseCalendarScheduleOptions = {}) {
    const includeStatuses = options.includeStatuses ?? defaultStatuses
    const bounds = monthBounds(month)
    const todayIso = toIsoDate(new Date())

    const queryResult = useLiveQuery(async (): Promise<CalendarQueryResult> => {
        try {
            const [commitments, history] = await Promise.all([
                listCommitmentsWithTerms(),
                db.paymentHistory.toArray()
            ])
            return { commitments, history, error: null }
        } catch (error: unknown) {
            return { commitments: [], history: [], error: normalizeError(error) }
        }
    }, [])

    const loading = queryResult === undefined
    const error = queryResult?.error ?? null
    const commitments = queryResult?.commitments ?? []
    const history = queryResult?.history ?? []

    const historyByDueKey = useMemo(() => {
        const map = new Map<string, PaymentHistory>()
        for (const row of history) {
            const key = `${row.commitmentId}|${row.dueDate}`
            const existing = map.get(key)
            if (!existing) {
                map.set(key, row)
                continue
            }
            const shouldReplace = row.actionDate > existing.actionDate
                || (row.actionDate === existing.actionDate && row.createdAt > existing.createdAt)
            if (shouldReplace) map.set(key, row)
        }
        return map
    }, [history])

    const items = useMemo<CalendarScheduleItem[]>(() => {
        const rows: CalendarScheduleItem[] = []

        for (const entry of commitments) {
            if (!includeStatuses.includes(entry.commitment.status)) continue
            const dueItems = buildOccurrencesForTerms(entry.commitment.id, entry.terms, bounds.start, bounds.end)
            const uniqueDueDates = Array.from(new Set(dueItems.map(item => item.dueDate)))
            for (const dueDate of uniqueDueDates) {
                const term = resolveTermAtDate(entry.terms, dueDate)
                if (!term) continue
                const dueKey = `${entry.commitment.id}|${dueDate}`
                const historyRow = historyByDueKey.get(dueKey)
                rows.push({
                    commitmentId: entry.commitment.id,
                    commitmentType: entry.commitment.type,
                    title: entry.commitment.title,
                    category: entry.commitment.category,
                    status: entry.commitment.status,
                    dueDate,
                    amountCents: term.amountCents,
                    scheduleStatus: historyRow?.status ?? 'pending'
                })
            }
        }

        return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
    }, [bounds.end, bounds.start, commitments, historyByDueKey, includeStatuses])

    const byDate = useMemo(() => {
        return items.reduce<Record<string, CalendarScheduleItem[]>>((acc, item) => {
            if (!acc[item.dueDate]) acc[item.dueDate] = []
            acc[item.dueDate].push(item)
            return acc
        }, {})
    }, [items])

    const monthTotalCents = useMemo(() => {
        return items.reduce((sum, item) => sum + item.amountCents, 0)
    }, [items])

    const dueSoonCount = useMemo(() => {
        const windowEnd = new Date()
        windowEnd.setDate(windowEnd.getDate() + 30)
        const maxIso = toIsoDate(windowEnd)
        return items.filter(item => item.dueDate >= todayIso && item.dueDate <= maxIso).length
    }, [items, todayIso])

    return {
        loading,
        error,
        month: {
            start: bounds.start,
            end: bounds.end
        },
        items,
        byDate,
        monthTotalCents,
        dueSoonCount
    }
}
