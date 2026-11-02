import { db } from './database'
import { addDaysIso } from './domainDate'
import type { CommitmentTerm } from '../types/index'

export interface CommitmentTermCreateInput {
    id: string
    commitmentId: string
    validFrom: string
    validTo?: string
    amountCents: number
    frequency: CommitmentTerm['frequency']
    dayOfMonth?: number
    anchorDay?: number
    endOfMonthPolicy?: CommitmentTerm['endOfMonthPolicy']
    monthOfYear?: number
    installmentTotal?: number
    allowGap?: boolean
}

function assertAmountCents(amountCents: number): void {
    if (!Number.isInteger(amountCents)) throw new Error('amountCents must be an integer')
    if (amountCents < 0) throw new Error('amountCents cannot be negative')
}

function ensureNoOverlap(terms: CommitmentTerm[], next: CommitmentTerm): void {
    for (const term of terms) {
        if (term.id === next.id) continue
        const termStart = term.validFrom
        const termEnd = term.validTo ?? '9999-12-31'
        const nextStart = next.validFrom
        const nextEnd = next.validTo ?? '9999-12-31'
        if (termStart <= nextEnd && nextStart <= termEnd) {
            throw new Error(`Commitment term overlap detected for commitment ${next.commitmentId}`)
        }
    }
}

function parseIsoDay(isoDate: string): number | undefined {
    const day = Number(isoDate.split('-')[2])
    if (!Number.isFinite(day) || day < 1 || day > 31) return undefined
    return day
}

function ensureNoGap(terms: CommitmentTerm[], next: CommitmentTerm): void {
    const sorted = [...terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
    const prev = [...sorted]
        .filter(term => term.validFrom < next.validFrom)
        .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0]
    const following = [...sorted]
        .filter(term => term.validFrom > next.validFrom)
        .sort((a, b) => a.validFrom.localeCompare(b.validFrom))[0]

    if (prev) {
        if (!prev.validTo) {
            throw new Error('Cannot insert a new term after an open-ended term without first closing it')
        }
        const expectedStart = addDaysIso(prev.validTo, 1)
        if (expectedStart !== next.validFrom) {
            throw new Error(`Gap detected before new term. Expected validFrom ${expectedStart}`)
        }
    }

    if (following) {
        if (!next.validTo) {
            throw new Error(`Gap rule violated: new term must define validTo before next term ${following.validFrom}`)
        }
        const expectedNextStart = addDaysIso(next.validTo, 1)
        if (expectedNextStart !== following.validFrom) {
            throw new Error(`Gap detected after new term. Expected next term to start at ${expectedNextStart}`)
        }
    }
}

function buildTerm(input: CommitmentTermCreateInput, nowIso: string): CommitmentTerm {
    const derivedAnchorDay = (input.frequency === 'monthly' || input.frequency === 'quarterly')
        ? (input.anchorDay ?? parseIsoDay(input.validFrom))
        : input.anchorDay

    return {
        id: input.id,
        commitmentId: input.commitmentId,
        validFrom: input.validFrom,
        validTo: input.validTo,
        amountCents: input.amountCents,
        frequency: input.frequency,
        dayOfMonth: input.dayOfMonth ?? derivedAnchorDay,
        anchorDay: derivedAnchorDay,
        endOfMonthPolicy: input.endOfMonthPolicy,
        monthOfYear: input.monthOfYear,
        installmentTotal: input.installmentTotal,
        createdAt: nowIso,
        updatedAt: nowIso
    }
}

export async function addCommitmentTerm(input: CommitmentTermCreateInput): Promise<CommitmentTerm> {
    assertAmountCents(input.amountCents)

    return db.transaction('rw', db.commitments, db.commitmentTerms, async () => {
        const commitment = await db.commitments.get(input.commitmentId)
        if (!commitment) throw new Error(`Commitment not found: ${input.commitmentId}`)

        const nowIso = new Date().toISOString()
        const next = buildTerm(input, nowIso)

        const existingTerms = await db.commitmentTerms.where('commitmentId').equals(input.commitmentId).toArray()
        ensureNoOverlap(existingTerms, next)
        if (!(input.allowGap ?? false)) ensureNoGap(existingTerms, next)

        await db.commitmentTerms.put(next)
        await db.commitments.update(input.commitmentId, { updatedAt: nowIso })
        return next
    })
}

export async function addOrReplaceCurrentCommitmentTerm(input: CommitmentTermCreateInput): Promise<CommitmentTerm> {
    assertAmountCents(input.amountCents)

    return db.transaction('rw', db.commitments, db.commitmentTerms, async () => {
        const commitment = await db.commitments.get(input.commitmentId)
        if (!commitment) throw new Error(`Commitment not found: ${input.commitmentId}`)

        const allTerms = await db.commitmentTerms.where('commitmentId').equals(input.commitmentId).sortBy('validFrom')
        const current = allTerms[allTerms.length - 1]
        const nowIso = new Date().toISOString()

        if (current && input.validFrom <= current.validFrom) {
            throw new Error('validFrom must be after the latest term validFrom')
        }

        if (current && (current.validTo === undefined || current.validTo >= input.validFrom)) {
            await db.commitmentTerms.update(current.id, {
                validTo: addDaysIso(input.validFrom, -1),
                updatedAt: nowIso
            })
        }

        const next = buildTerm(input, nowIso)
        const termsAfterClose = await db.commitmentTerms.where('commitmentId').equals(input.commitmentId).toArray()
        ensureNoOverlap(termsAfterClose, next)

        await db.commitmentTerms.put(next)
        await db.commitments.update(input.commitmentId, { updatedAt: nowIso })
        return next
    })
}

export async function getCommitmentTerms(commitmentId: string): Promise<CommitmentTerm[]> {
    return db.commitmentTerms.where('commitmentId').equals(commitmentId).sortBy('validFrom')
}
