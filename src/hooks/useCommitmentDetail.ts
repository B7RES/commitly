import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getCommitmentWithTerms } from '../services/commitmentService'
import { getCommitmentPaymentHistory } from '../services/paymentHistoryService'
import {
    monthlyEquivalentCents,
    paidInstallmentsCount,
    remainingInstallmentsCount,
    residualDebtCents
} from '../services/commitmentCalculations'
import {
    normalizeError,
    resolveNextDueDate,
    resolveTermAtDate,
    toIsoDate
} from './commitmentReadModel'

interface DetailQueryResult {
    record: Awaited<ReturnType<typeof getCommitmentWithTerms>>
    history: Awaited<ReturnType<typeof getCommitmentPaymentHistory>>
    error: string | null
}

export function useCommitmentDetail(commitmentId: string | null | undefined) {
    const todayIso = toIsoDate(new Date())

    const queryResult = useLiveQuery(async (): Promise<DetailQueryResult> => {
        if (!commitmentId) {
            return { record: null, history: [], error: null }
        }

        try {
            const [record, history] = await Promise.all([
                getCommitmentWithTerms(commitmentId),
                getCommitmentPaymentHistory(commitmentId)
            ])
            return { record, history, error: null }
        } catch (error: unknown) {
            return { record: null, history: [], error: normalizeError(error) }
        }
    }, [commitmentId])

    const loading = queryResult === undefined
    const error = queryResult?.error ?? null
    const record = queryResult?.record ?? null
    const history = queryResult?.history ?? []
    const commitment = record?.commitment ?? null
    const terms = record?.terms ?? []
    const missing = !loading && !error && !!commitmentId && !commitment

    const metrics = useMemo(() => {
        const paidCount = paidInstallmentsCount(history)
        const currentTerm = resolveTermAtDate(terms, todayIso)
        const monthlyEquivalent = currentTerm ? monthlyEquivalentCents(currentTerm) : 0
        const remainingInstallments = currentTerm ? remainingInstallmentsCount(currentTerm, history) : null
        const residualDebt = residualDebtCents(terms, history)
        const nextDueDate = resolveNextDueDate(terms, todayIso)

        return {
            paidInstallments: paidCount,
            remainingInstallments,
            monthlyEquivalentCents: monthlyEquivalent,
            residualDebtCents: residualDebt,
            residualDebtDeterminable: residualDebt !== null,
            nextDueDate
        }
    }, [history, terms, todayIso])

    return {
        loading,
        error,
        missing,
        commitment,
        terms,
        history,
        metrics
    }
}
