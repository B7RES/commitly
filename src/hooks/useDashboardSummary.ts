import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/database'
import { listCommitmentsWithTerms, type CommitmentWithTerms } from '../services/commitmentService'
import { residualDebtCents } from '../services/commitmentCalculations'
import type { CommitmentStatus, CommitmentType, PaymentHistory } from '../types/index'
import {
    buildOccurrencesForTerms,
    mapHistoryByCommitment,
    normalizeError,
    resolveMonthlyEquivalentCents,
    toIsoDate
} from './commitmentReadModel'

export interface DashboardUpcomingItem {
    commitmentId: string
    type: CommitmentType
    title: string
    dueDate: string
    amountCents: number
    category: string
    status: CommitmentStatus
}

export interface DashboardResidualDebtItem {
    commitmentId: string
    type: CommitmentType
    title: string
    status: CommitmentStatus
    residualDebtCents: number | null
    determinable: boolean
}

interface DashboardQueryResult {
    commitments: CommitmentWithTerms[]
    history: PaymentHistory[]
    error: string | null
}

export function useDashboardSummary() {
    const todayIso = toIsoDate(new Date())

    const queryResult = useLiveQuery(async (): Promise<DashboardQueryResult> => {
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

    const statusTotals = useMemo(() => {
        const totals: Record<CommitmentStatus, number> = {
            active: 0,
            paused: 0,
            archived: 0,
            completed: 0
        }

        for (const entry of commitments) {
            totals[entry.commitment.status] += 1
        }

        return totals
    }, [commitments])

    const monthlyEquivalentCents = useMemo(() => {
        return commitments
            .filter(entry => entry.commitment.status === 'active')
            .reduce((sum, entry) => sum + resolveMonthlyEquivalentCents(entry.terms, todayIso), 0)
    }, [commitments, todayIso])

    const upcoming = useMemo<DashboardUpcomingItem[]>(() => {
        const endIso = new Date()
        endIso.setDate(endIso.getDate() + 60)
        const endRange = toIsoDate(endIso)
        const registeredDueKeys = new Set(history.map(row => `${row.commitmentId}|${row.dueDate}`))

        const rows: DashboardUpcomingItem[] = []
        for (const entry of commitments) {
            if (entry.commitment.status !== 'active') continue
            const dueItems = buildOccurrencesForTerms(entry.commitment.id, entry.terms, todayIso, endRange)
            for (const due of dueItems) {
                const dueKey = `${entry.commitment.id}|${due.dueDate}`
                if (registeredDueKeys.has(dueKey)) continue
                rows.push({
                    commitmentId: entry.commitment.id,
                    type: entry.commitment.type,
                    title: entry.commitment.title,
                    category: entry.commitment.category,
                    status: entry.commitment.status,
                    dueDate: due.dueDate,
                    amountCents: due.amountCents
                })
            }
        }

        return rows
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
            .slice(0, 12)
    }, [commitments, history, todayIso])

    const residualDebt = useMemo(() => {
        const historyByCommitment = mapHistoryByCommitment(history)
        const items: DashboardResidualDebtItem[] = commitments
            .map(entry => {
                const commitmentHistory = historyByCommitment.get(entry.commitment.id) ?? []
                const value = residualDebtCents(entry.terms, commitmentHistory)
                return {
                    commitmentId: entry.commitment.id,
                    type: entry.commitment.type,
                    title: entry.commitment.title,
                    status: entry.commitment.status,
                    residualDebtCents: value,
                    determinable: value !== null
                }
            })
            .filter(item => item.status !== 'archived')

        const determinableTotalCents = items
            .filter(item => item.residualDebtCents !== null)
            .reduce((sum, item) => sum + (item.residualDebtCents ?? 0), 0)

        const undetermined = items.filter(item => item.residualDebtCents === null)

        return {
            items,
            determinableTotalCents,
            undeterminedCount: undetermined.length,
            undeterminedCommitmentIds: undetermined.map(item => item.commitmentId)
        }
    }, [commitments, history])

    return {
        loading,
        error,
        statusTotals,
        monthlyEquivalentCents,
        upcoming,
        residualDebt
    }
}
