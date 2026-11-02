import Dexie, { type Table } from 'dexie'
import type { Commitment, CommitmentTerm, PaymentHistory } from '../types/index'

class PaymentsDatabase extends Dexie {
  commitments!: Table<Commitment, string>
  commitmentTerms!: Table<CommitmentTerm, string>
  paymentHistory!: Table<PaymentHistory, string>

  constructor() {
    super('payments-local-db')
    // v5 removes all legacy tables and keeps only the commitments data model.
    this.version(5).stores({
      commitments: 'id, status, type, startDate, endDate, updatedAt',
      commitmentTerms: 'id, commitmentId, validFrom, validTo, [commitmentId+validFrom]',
      paymentHistory: 'id, commitmentId, dueDate, actionDate, status, [commitmentId+dueDate]'
    })
  }
}

export const db = new PaymentsDatabase()
