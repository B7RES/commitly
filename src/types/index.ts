export interface BackupDataV2 {
  version: 2
  exportedAt: string
  commitments: Commitment[]
  commitmentTerms: CommitmentTerm[]
  paymentHistory: PaymentHistory[]
}

export type CommitmentType = 'subscription' | 'recurring' | 'financing'
export type CommitmentStatus = 'active' | 'paused' | 'completed' | 'archived'
export type TermFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once'
export type EndOfMonthPolicy = 'clamp'
export type PaymentHistoryStatus = 'paid' | 'skipped'

export interface Commitment {
  id: string
  type: CommitmentType
  title: string
  category: string
  notes?: string
  status: CommitmentStatus
  startDate: string
  endDate?: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface CommitmentTerm {
  id: string
  commitmentId: string
  validFrom: string
  validTo?: string
  amountCents: number
  frequency: TermFrequency
  dayOfMonth?: number
  anchorDay?: number
  endOfMonthPolicy?: EndOfMonthPolicy
  monthOfYear?: number
  installmentTotal?: number
  createdAt: string
  updatedAt: string
}

export interface PaymentHistory {
  id: string
  commitmentId: string
  dueDate: string
  actionDate: string
  status: PaymentHistoryStatus
  amountCents: number
  note?: string
  createdAt: string
}
