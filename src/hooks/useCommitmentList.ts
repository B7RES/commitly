import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { CommitmentStatus } from '../types/index'
import { listCommitmentsWithTerms, type CommitmentWithTerms } from '../services/commitmentService'
import {
    commitmentTitle,
    normalizeError,
    resolveNextDueDate,
    sortCommitmentsByMonthlyEquivalent,
    sortCommitmentsByNextDue,
    sortCommitmentsByTitle,
    sortCommitmentsByUpdated,
    statusMatchesFilter,
    toIsoDate
} from './commitmentReadModel'

export type CommitmentListSortBy = 'updatedAt' | 'title' | 'nextDueDate' | 'monthlyEquivalentCents'
export type CommitmentListSortOrder = 'asc' | 'desc'

export interface UseCommitmentListOptions {
    query?: string
    status?: CommitmentStatus | 'all'
    sortBy?: CommitmentListSortBy
    sortOrder?: CommitmentListSortOrder
}

export interface CommitmentListItem {
    item: CommitmentWithTerms
    nextDueDate: string | null
}

interface QueryResult {
    items: CommitmentWithTerms[]
    error: string | null
}

export function useCommitmentList(options: UseCommitmentListOptions = {}) {
    const todayIso = toIsoDate(new Date())
    const query = options.query?.trim().toLowerCase() ?? ''
    const status = options.status ?? 'all'
    const sortBy = options.sortBy ?? 'updatedAt'
    const sortOrder = options.sortOrder ?? 'desc'

    const queryResult = useLiveQuery(async (): Promise<QueryResult> => {
        try {
            const items = await listCommitmentsWithTerms()
            return { items, error: null }
        } catch (error: unknown) {
            return { items: [], error: normalizeError(error) }
        }
    }, [])

    const loading = queryResult === undefined
    const error = queryResult?.error ?? null
    const baseItems = queryResult?.items ?? []

    const filteredAndSorted = useMemo(() => {
        const filtered = baseItems.filter(entry => {
            if (!statusMatchesFilter(entry.commitment.status, status)) return false
            if (!query) return true
            return commitmentTitle(entry.commitment).includes(query)
        })

        if (sortBy === 'title') return sortCommitmentsByTitle(filtered, sortOrder)
        if (sortBy === 'nextDueDate') return sortCommitmentsByNextDue(filtered, sortOrder, todayIso)
        if (sortBy === 'monthlyEquivalentCents') return sortCommitmentsByMonthlyEquivalent(filtered, sortOrder, todayIso)
        return sortCommitmentsByUpdated(filtered, sortOrder)
    }, [baseItems, query, sortBy, sortOrder, status, todayIso])

    const items = useMemo<CommitmentListItem[]>(() => {
        return filteredAndSorted.map(entry => ({
            item: entry,
            nextDueDate: resolveNextDueDate(entry.terms, todayIso)
        }))
    }, [filteredAndSorted, todayIso])

    return {
        loading,
        error,
        total: items.length,
        items
    }
}
