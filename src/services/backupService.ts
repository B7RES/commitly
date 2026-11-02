import { db } from './database'
import type {
    Commitment,
    CommitmentStatus,
    CommitmentTerm,
    CommitmentType,
    PaymentHistory,
    PaymentHistoryStatus,
    TermFrequency
} from '../types/index'

export const BACKUP_VERSION = 2

export interface AppBackupDataV2 {
    version: 2
    exportedAt: string
    commitments: Commitment[]
    commitmentTerms: CommitmentTerm[]
    paymentHistory: PaymentHistory[]
}

export interface BackupPreview {
    fileName: string
    version: number
    exportedAt: string
    commitmentsCount: number
    commitmentTermsCount: number
    paymentHistoryCount: number
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isIsoDateTime(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
}

function asString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} non valido`)
    return value
}

function asOptionalString(value: unknown, field: string): string | undefined {
    if (value === undefined) return undefined
    if (typeof value !== 'string') throw new Error(`${field} non valido`)
    return value
}

function asInt(value: unknown, field: string): number {
    if (!Number.isInteger(value as number)) throw new Error(`${field} deve essere un intero`)
    return value as number
}

function asOptionalInt(value: unknown, field: string): number | undefined {
    if (value === undefined) return undefined
    return asInt(value, field)
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
    if (typeof value !== 'string' || !allowed.includes(value as T)) {
        throw new Error(`${field} non valido`)
    }
    return value as T
}

function parseCommitment(raw: unknown): Commitment {
    if (!isObject(raw)) throw new Error('Record commitment non valido')

    const startDate = raw.startDate
    const endDate = raw.endDate

    if (!isIsoDate(startDate)) throw new Error('commitment.startDate non valida')
    if (endDate !== undefined && !isIsoDate(endDate)) throw new Error('commitment.endDate non valida')
    if (typeof endDate === 'string' && endDate < startDate) throw new Error('commitment.endDate precedente a startDate')

    const parsed: Commitment = {
        id: asString(raw.id, 'commitment.id'),
        type: asEnum<CommitmentType>(raw.type, ['subscription', 'recurring', 'financing'], 'commitment.type'),
        title: asString(raw.title, 'commitment.title'),
        category: asString(raw.category, 'commitment.category'),
        notes: asOptionalString(raw.notes, 'commitment.notes'),
        status: asEnum<CommitmentStatus>(raw.status, ['active', 'paused', 'completed', 'archived'], 'commitment.status'),
        startDate,
        endDate: endDate as string | undefined,
        currency: asString(raw.currency, 'commitment.currency'),
        createdAt: asString(raw.createdAt, 'commitment.createdAt'),
        updatedAt: asString(raw.updatedAt, 'commitment.updatedAt')
    }

    if (!isIsoDateTime(parsed.createdAt) || !isIsoDateTime(parsed.updatedAt)) {
        throw new Error('commitment.createdAt/updatedAt non validi')
    }

    return parsed
}

function parseCommitmentTerm(raw: unknown): CommitmentTerm {
    if (!isObject(raw)) throw new Error('Record commitmentTerm non valido')

    const validFrom = raw.validFrom
    const validTo = raw.validTo
    if (!isIsoDate(validFrom)) throw new Error('commitmentTerm.validFrom non valida')
    if (validTo !== undefined && !isIsoDate(validTo)) throw new Error('commitmentTerm.validTo non valida')
    if (typeof validTo === 'string' && validTo < validFrom) throw new Error('commitmentTerm.validTo precedente a validFrom')

    const amountCents = asInt(raw.amountCents, 'commitmentTerm.amountCents')
    if (amountCents < 0) throw new Error('commitmentTerm.amountCents negativo')

    const dayOfMonth = asOptionalInt(raw.dayOfMonth, 'commitmentTerm.dayOfMonth')
    const anchorDay = asOptionalInt(raw.anchorDay, 'commitmentTerm.anchorDay')
    const monthOfYear = asOptionalInt(raw.monthOfYear, 'commitmentTerm.monthOfYear')
    const installmentTotal = asOptionalInt(raw.installmentTotal, 'commitmentTerm.installmentTotal')

    if (dayOfMonth !== undefined && (dayOfMonth < 1 || dayOfMonth > 31)) throw new Error('commitmentTerm.dayOfMonth fuori range')
    if (anchorDay !== undefined && (anchorDay < 1 || anchorDay > 31)) throw new Error('commitmentTerm.anchorDay fuori range')
    if (monthOfYear !== undefined && (monthOfYear < 1 || monthOfYear > 12)) throw new Error('commitmentTerm.monthOfYear fuori range')
    if (installmentTotal !== undefined && installmentTotal < 1) throw new Error('commitmentTerm.installmentTotal non valido')

    const parsed: CommitmentTerm = {
        id: asString(raw.id, 'commitmentTerm.id'),
        commitmentId: asString(raw.commitmentId, 'commitmentTerm.commitmentId'),
        validFrom,
        validTo: validTo as string | undefined,
        amountCents,
        frequency: asEnum<TermFrequency>(raw.frequency, ['weekly', 'monthly', 'quarterly', 'yearly', 'once'], 'commitmentTerm.frequency'),
        dayOfMonth,
        anchorDay,
        endOfMonthPolicy: raw.endOfMonthPolicy === undefined
            ? undefined
            : asEnum<'clamp'>(raw.endOfMonthPolicy, ['clamp'], 'commitmentTerm.endOfMonthPolicy'),
        monthOfYear,
        installmentTotal,
        createdAt: asString(raw.createdAt, 'commitmentTerm.createdAt'),
        updatedAt: asString(raw.updatedAt, 'commitmentTerm.updatedAt')
    }

    if (!isIsoDateTime(parsed.createdAt) || !isIsoDateTime(parsed.updatedAt)) {
        throw new Error('commitmentTerm.createdAt/updatedAt non validi')
    }

    return parsed
}

function parsePaymentHistory(raw: unknown): PaymentHistory {
    if (!isObject(raw)) throw new Error('Record paymentHistory non valido')

    const dueDate = raw.dueDate
    const actionDate = raw.actionDate

    if (!isIsoDate(dueDate)) throw new Error('paymentHistory.dueDate non valida')
    if (!isIsoDate(actionDate)) throw new Error('paymentHistory.actionDate non valida')

    const status = asEnum<PaymentHistoryStatus>(raw.status, ['paid', 'skipped'], 'paymentHistory.status')
    const amountCents = asInt(raw.amountCents, 'paymentHistory.amountCents')
    if (amountCents < 0) throw new Error('paymentHistory.amountCents negativo')
    if (status === 'paid' && amountCents <= 0) throw new Error('paymentHistory paid richiede amountCents > 0')
    if (status === 'skipped' && amountCents !== 0) throw new Error('paymentHistory skipped richiede amountCents = 0')

    const parsed: PaymentHistory = {
        id: asString(raw.id, 'paymentHistory.id'),
        commitmentId: asString(raw.commitmentId, 'paymentHistory.commitmentId'),
        dueDate,
        actionDate,
        status,
        amountCents,
        note: asOptionalString(raw.note, 'paymentHistory.note'),
        createdAt: asString(raw.createdAt, 'paymentHistory.createdAt')
    }

    if (!isIsoDateTime(parsed.createdAt)) throw new Error('paymentHistory.createdAt non valido')

    return parsed
}

function assertNoDuplicateIds<T extends { id: string }>(items: T[], label: string): void {
    const ids = new Set<string>()
    for (const item of items) {
        if (ids.has(item.id)) throw new Error(`ID duplicato in ${label}: ${item.id}`)
        ids.add(item.id)
    }
}

function assertRelationships(data: AppBackupDataV2): void {
    const commitmentIds = new Set(data.commitments.map(item => item.id))

    for (const term of data.commitmentTerms) {
        if (!commitmentIds.has(term.commitmentId)) {
            throw new Error(`Termine ${term.id} con commitmentId inesistente: ${term.commitmentId}`)
        }
    }

    for (const row of data.paymentHistory) {
        if (!commitmentIds.has(row.commitmentId)) {
            throw new Error(`PaymentHistory ${row.id} con commitmentId inesistente: ${row.commitmentId}`)
        }
    }

    const occurrenceKeys = new Set<string>()
    for (const row of data.paymentHistory) {
        const key = `${row.commitmentId}|${row.dueDate}`
        if (occurrenceKeys.has(key)) {
            throw new Error(`Occorrenza duplicata in PaymentHistory: ${key}`)
        }
        occurrenceKeys.add(key)
    }
}

function assertNoTermOverlap(data: AppBackupDataV2): void {
    const byCommitment = new Map<string, CommitmentTerm[]>()
    for (const term of data.commitmentTerms) {
        const list = byCommitment.get(term.commitmentId)
        if (list) list.push(term)
        else byCommitment.set(term.commitmentId, [term])
    }

    for (const terms of byCommitment.values()) {
        const sorted = [...terms].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
        for (let i = 0; i < sorted.length - 1; i += 1) {
            const current = sorted[i]
            const next = sorted[i + 1]
            const currentEnd = current.validTo ?? '9999-12-31'
            if (next.validFrom <= currentEnd) {
                throw new Error(`Sovrapposizione termini rilevata per commitmentId ${current.commitmentId}`)
            }
        }
    }
}

export async function exportBackupV2(): Promise<{ filename: string; content: string }> {
    const [commitments, commitmentTerms, paymentHistory] = await Promise.all([
        db.commitments.toArray(),
        db.commitmentTerms.toArray(),
        db.paymentHistory.toArray()
    ])

    const payload: AppBackupDataV2 = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        commitments,
        commitmentTerms,
        paymentHistory
    }

    const yyyyMmDd = new Date().toISOString().slice(0, 10)
    return {
        filename: `payments-backup-v${BACKUP_VERSION}-${yyyyMmDd}.json`,
        content: JSON.stringify(payload, null, 2)
    }
}

export function parseAndValidateBackupV2(rawText: string, fileName: string): { data: AppBackupDataV2; preview: BackupPreview } {
    let parsedUnknown: unknown
    try {
        parsedUnknown = JSON.parse(rawText)
    } catch {
        throw new Error('JSON non valido o corrotto')
    }

    if (!isObject(parsedUnknown)) throw new Error('Struttura backup non valida')

    const versionRaw = parsedUnknown.version
    if (versionRaw !== BACKUP_VERSION) {
        throw new Error(`Versione backup non supportata: ${String(versionRaw)} (attesa: ${BACKUP_VERSION})`)
    }

    const exportedAtRaw = parsedUnknown.exportedAt
    if (!isIsoDateTime(exportedAtRaw)) throw new Error('Timestamp export non valido')

    if (!Array.isArray(parsedUnknown.commitments)) throw new Error('Campo commitments mancante o non valido')
    if (!Array.isArray(parsedUnknown.commitmentTerms)) throw new Error('Campo commitmentTerms mancante o non valido')
    if (!Array.isArray(parsedUnknown.paymentHistory)) throw new Error('Campo paymentHistory mancante o non valido')

    const data: AppBackupDataV2 = {
        version: BACKUP_VERSION,
        exportedAt: exportedAtRaw,
        commitments: parsedUnknown.commitments.map(parseCommitment),
        commitmentTerms: parsedUnknown.commitmentTerms.map(parseCommitmentTerm),
        paymentHistory: parsedUnknown.paymentHistory.map(parsePaymentHistory)
    }

    assertNoDuplicateIds(data.commitments, 'commitments')
    assertNoDuplicateIds(data.commitmentTerms, 'commitmentTerms')
    assertNoDuplicateIds(data.paymentHistory, 'paymentHistory')
    assertRelationships(data)
    assertNoTermOverlap(data)

    return {
        data,
        preview: {
            fileName,
            version: data.version,
            exportedAt: data.exportedAt,
            commitmentsCount: data.commitments.length,
            commitmentTermsCount: data.commitmentTerms.length,
            paymentHistoryCount: data.paymentHistory.length
        }
    }
}

export async function restoreBackupV2(data: AppBackupDataV2, options?: { simulateFailureAfterClear?: boolean }): Promise<void> {
    await db.transaction('rw', db.commitments, db.commitmentTerms, db.paymentHistory, async () => {
        await db.paymentHistory.clear()
        await db.commitmentTerms.clear()
        await db.commitments.clear()

        if (options?.simulateFailureAfterClear) {
            throw new Error('Simulated restore failure')
        }

        if (data.commitments.length) await db.commitments.bulkAdd(data.commitments)
        if (data.commitmentTerms.length) await db.commitmentTerms.bulkAdd(data.commitmentTerms)
        if (data.paymentHistory.length) await db.paymentHistory.bulkAdd(data.paymentHistory)
    })
}
