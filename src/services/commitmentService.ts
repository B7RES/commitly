import { db } from './database'
import type { Commitment, CommitmentStatus, CommitmentTerm } from '../types/index'

export interface CommitmentCreateInput {
    id: string
    type: Commitment['type']
    title: string
    category: string
    notes?: string
    status?: CommitmentStatus
    startDate: string
    endDate?: string
    currency?: string
}

export interface CommitmentUpdateInput {
    type?: Commitment['type']
    title?: string
    category?: string
    notes?: string
    startDate?: string
    endDate?: string
    currency?: string
}

export interface CommitmentWithTerms {
    commitment: Commitment
    terms: CommitmentTerm[]
}

export async function createCommitment(input: CommitmentCreateInput): Promise<Commitment> {
    const now = new Date().toISOString()
    const commitment: Commitment = {
        id: input.id,
        type: input.type,
        title: input.title.trim(),
        category: input.category,
        notes: input.notes,
        status: input.status ?? 'active',
        startDate: input.startDate,
        endDate: input.endDate,
        currency: input.currency ?? 'EUR',
        createdAt: now,
        updatedAt: now
    }

    await db.commitments.put(commitment)
    return commitment
}

export async function updateCommitment(commitmentId: string, patch: CommitmentUpdateInput): Promise<void> {
    const existing = await db.commitments.get(commitmentId)
    if (!existing) throw new Error(`Commitment not found: ${commitmentId}`)

    await db.commitments.update(commitmentId, {
        ...patch,
        updatedAt: new Date().toISOString()
    })
}

export async function setCommitmentStatus(commitmentId: string, status: CommitmentStatus): Promise<void> {
    const updated = await db.commitments.update(commitmentId, {
        status,
        updatedAt: new Date().toISOString()
    })
    if (!updated) throw new Error(`Commitment not found: ${commitmentId}`)
}

export async function archiveCommitment(commitmentId: string): Promise<void> {
    await setCommitmentStatus(commitmentId, 'archived')
}

export async function pauseCommitment(commitmentId: string): Promise<void> {
    await setCommitmentStatus(commitmentId, 'paused')
}

export async function getCommitmentWithTerms(commitmentId: string): Promise<CommitmentWithTerms | null> {
    const commitment = await db.commitments.get(commitmentId)
    if (!commitment) return null
    const terms = await db.commitmentTerms.where('commitmentId').equals(commitmentId).sortBy('validFrom')
    return { commitment, terms }
}

export async function listCommitmentsWithTerms(): Promise<CommitmentWithTerms[]> {
    const commitments = await db.commitments.toArray()
    const terms = await db.commitmentTerms.toArray()

    return commitments.map(commitment => ({
        commitment,
        terms: terms
            .filter(term => term.commitmentId === commitment.id)
            .sort((a, b) => a.validFrom.localeCompare(b.validFrom))
    }))
}
