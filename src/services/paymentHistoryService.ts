import { db } from './database'
import type { PaymentHistory } from '../types/index'

export interface PaymentHistoryInput {
    id: string
    commitmentId: string
    dueDate: string
    actionDate: string
    note?: string
}

export async function getHistoryForOccurrence(commitmentId: string, dueDate: string): Promise<PaymentHistory[]> {
    return db.paymentHistory
        .where('[commitmentId+dueDate]')
        .equals([commitmentId, dueDate])
        .sortBy('actionDate')
}

async function assertNoDuplicateOccurrence(commitmentId: string, dueDate: string): Promise<void> {
    const existing = await db.paymentHistory
        .where('[commitmentId+dueDate]')
        .equals([commitmentId, dueDate])
        .count()

    if (existing > 0) {
        throw new Error(`Occurrence already registered for commitment ${commitmentId} on ${dueDate}`)
    }
}

function assertIntegerCents(amountCents: number): void {
    if (!Number.isInteger(amountCents)) throw new Error('amountCents must be an integer')
}

function sameHistoryPayload(a: PaymentHistory, b: PaymentHistory): boolean {
    return a.commitmentId === b.commitmentId
        && a.dueDate === b.dueDate
        && a.actionDate === b.actionDate
        && a.status === b.status
        && a.amountCents === b.amountCents
        && (a.note ?? '') === (b.note ?? '')
}

async function ensureIdempotentById(next: PaymentHistory): Promise<PaymentHistory | null> {
    const existing = await db.paymentHistory.get(next.id)
    if (!existing) return null
    if (sameHistoryPayload(existing, next)) return existing
    throw new Error(`PaymentHistory ID conflict: ${next.id}`)
}

export async function registerPaidPayment(input: PaymentHistoryInput & { amountCents: number }): Promise<PaymentHistory> {
    assertIntegerCents(input.amountCents)
    if (input.amountCents <= 0) throw new Error('Paid payment must have a positive amountCents')

    return db.transaction('rw', db.commitments, db.paymentHistory, async () => {
        const commitment = await db.commitments.get(input.commitmentId)
        if (!commitment) throw new Error(`Commitment not found: ${input.commitmentId}`)

        await assertNoDuplicateOccurrence(input.commitmentId, input.dueDate)

        const history: PaymentHistory = {
            id: input.id,
            commitmentId: input.commitmentId,
            dueDate: input.dueDate,
            actionDate: input.actionDate,
            status: 'paid',
            amountCents: input.amountCents,
            note: input.note,
            createdAt: new Date().toISOString()
        }

        const existing = await ensureIdempotentById(history)
        if (existing) return existing

        await db.paymentHistory.put(history)
        await db.commitments.update(input.commitmentId, { updatedAt: new Date().toISOString() })
        return history
    })
}

export async function registerSkippedPayment(input: PaymentHistoryInput): Promise<PaymentHistory> {
    return db.transaction('rw', db.commitments, db.paymentHistory, async () => {
        const commitment = await db.commitments.get(input.commitmentId)
        if (!commitment) throw new Error(`Commitment not found: ${input.commitmentId}`)

        await assertNoDuplicateOccurrence(input.commitmentId, input.dueDate)

        const history: PaymentHistory = {
            id: input.id,
            commitmentId: input.commitmentId,
            dueDate: input.dueDate,
            actionDate: input.actionDate,
            status: 'skipped',
            amountCents: 0,
            note: input.note,
            createdAt: new Date().toISOString()
        }

        const existing = await ensureIdempotentById(history)
        if (existing) return existing

        await db.paymentHistory.put(history)
        await db.commitments.update(input.commitmentId, { updatedAt: new Date().toISOString() })
        return history
    })
}

export async function getCommitmentPaymentHistory(commitmentId: string): Promise<PaymentHistory[]> {
    return db.paymentHistory
        .where('commitmentId')
        .equals(commitmentId)
        .sortBy('dueDate')
}
