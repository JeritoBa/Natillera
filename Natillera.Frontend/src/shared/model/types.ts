export type Page = 'landing' | 'auth' | 'dashboard' | 'loans' | 'activities' | 'payments' | 'transactions'

export interface Transaction {
  id: number
  date: string
  description: string
  member: string
  type: 'deposit' | 'withdrawal' | 'loan' | 'interest' | 'fee'
  amount: number
}

export interface Loan {
  id: number
  member: string
  amount: number
  balance: number
  rate: number
  startDate: string
  dueDate: string
  status: 'active' | 'paid' | 'overdue'
}

export interface Activity {
  id: number
  date: string
  description: string
  type: string
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
}

export interface Payment {
  id: number
  member: string
  month: string
  amount: number
  paidDate: string | null
  status: 'paid' | 'pending' | 'overdue'
}
