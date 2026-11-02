import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/database'
import { listCommitmentsWithTerms } from '../services/commitmentService'
import type { PaymentHistoryStatus } from '../types/index'
import { normalizeError } from './commitmentReadModel'

export type PaymentHistorySortBy = 'actionDate' | 'dueDate' | 'amountCents' | 'title' | 'status'
export type PaymentHistorySortOrder = 'asc' | 'desc'

export interface UsePaymentHistoryListOptions {
    query?: string
    commitmentId?: string
    status?: PaymentHistoryStatus | 'all'
    fromDate?: string
    toDate?: string
    sortBy?: PaymentHistorySortBy
    sortOrder?: PaymentHistorySortOrder
}

export interface PaymentHistoryListRow {
    id: string
    commitmentId: string
    commitmentTitle: string
    commitmentMissing: boolean
    dueDate: string
    actionDate: string
    amountCents: number
    status: PaymentHistoryStatus
    note?: string
    currency: string
}

export interface PaymentHistoryCommitmentOption {
    id: string
    label: string
    missing: boolean
}

interface QueryResult {
    rows: PaymentHistoryListRow[]
    commitmentOptions: PaymentHistoryCommitmentOption[]
    error: string | null
}

function statusRank(status: PaymentHistoryStatus): number {
    return status === 'paid' ? 0 : 1
}

export function usePaymentHistoryList(options: UsePaymentHistoryListOptions = {}) {
    const query = options.query?.trim().toLowerCase() ?? ''
    const commitmentId = options.commitmentId ?? 'all'
    const status = options.status ?? 'all'
    const fromDate = options.fromDate?.trim() ?? ''
    const toDate = options.toDate?.trim() ?? ''
    const sortBy = options.sortBy ?? 'actionDate'
    const sortOrder = options.sortOrder ?? 'desc'

    const queryResult = useLiveQuery(async (): Promise<QueryResult> => {
        try {
            const [history, commitmentsWithTerms] = await Promise.all([
                db.paymentHistory.toArray(),
                listCommitmentsWithTerms()
            ])

            const commitmentById = new Map(commitmentsWithTerms.map(item => [item.commitment.id, item.commitment]))

            const rows: PaymentHistoryListRow[] = history.map(entry => {
                const commitment = commitmentById.get(entry.commitmentId)
                return {
                    id: entry.id,
                    commitmentId: entry.commitmentId,
                    commitmentTitle: commitment?.title ?? 'Impegno non disponibile',
                    commitmentMissing: !commitment,
                    dueDate: entry.dueDate,
                    actionDate: entry.actionDate,
                    amountCents: entry.amountCents,
                    status: entry.status,
                    note: entry.note,
                    currency: commitment?.currency ?? 'EUR'
                }
            })

            const knownOptions: PaymentHistoryCommitmentOption[] = commitmentsWithTerms
                .map(item => ({
                    id: item.commitment.id,
                    label: item.commitment.title,
                    missing: false
                }))
                .sort((a, b) => a.label.localeCompare(b.label))

            const missingOptionsMap = new Map<string, PaymentHistoryCommitmentOption>()
            for (const row of rows) {
                if (!row.commitmentMissing) continue
                if (!missingOptionsMap.has(row.commitmentId)) {
                    missingOptionsMap.set(row.commitmentId, {
                        id: row.commitmentId,
                        label: `Impegno non disponibile (${row.commitmentId.slice(0, 8)})`,
                        missing: true
                    })
                }
            }

            return {
                rows,
                commitmentOptions: [...knownOptions, ...Array.from(missingOptionsMap.values())],
                error: null
            }
        } catch (error: unknown) {
            return { rows: [], commitmentOptions: [], error: normalizeError(error) }
        }
    }, [])

    const loading = queryResult === undefined
    const error = queryResult?.error ?? null
    const baseRows = queryResult?.rows ?? []
    const commitmentOptions = queryResult?.commitmentOptions ?? []

    const filteredRows = useMemo(() => {
        return baseRows.filter(row => {
            if (commitmentId !== 'all' && row.commitmentId !== commitmentId) return false
            if (status !== 'all' && row.status !== status) return false
            if (fromDate && row.actionDate < fromDate) return false
            if (toDate && row.actionDate > toDate) return false
            if (!query) return true

            const haystack = `${row.commitmentTitle} ${row.note ?? ''} ${row.dueDate} ${row.actionDate} ${row.status}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [baseRows, commitmentId, fromDate, query, status, toDate])

    const rows = useMemo(() => {
        const sorted = [...filteredRows]

        sorted.sort((a, b) => {
            let diff = 0
            if (sortBy === 'actionDate') diff = a.actionDate.localeCompare(b.actionDate)
            else if (sortBy === 'dueDate') diff = a.dueDate.localeCompare(b.dueDate)
            else if (sortBy === 'amountCents') diff = a.amountCents - b.amountCents
            else if (sortBy === 'status') diff = statusRank(a.status) - statusRank(b.status)
            else diff = a.commitmentTitle.localeCompare(b.commitmentTitle)

            if (diff === 0) diff = a.id.localeCompare(b.id)
            return sortOrder === 'asc' ? diff : -diff
        })

        return sorted
    }, [filteredRows, sortBy, sortOrder])

    const totals = useMemo(() => {
        const paid = rows.filter(row => row.status === 'paid')
        const skipped = rows.filter(row => row.status === 'skipped')

        return {
            totalCount: rows.length,
            paidCount: paid.length,
            skippedCount: skipped.length,
            paidAmountCents: paid.reduce((sum, row) => sum + row.amountCents, 0)
        }
    }, [rows])

    return {
        loading,
        error,
        rows,
        totals,
        commitmentOptions
    }
}
