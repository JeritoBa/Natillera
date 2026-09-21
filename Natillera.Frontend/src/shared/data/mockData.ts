import type { Activity, Loan, Payment, Transaction } from '@/shared/model/types'

export const transactions: Transaction[] = [
  { id: 1, date: '2026-09-18', description: 'Cuota mensual septiembre', member: 'Ana Martínez', type: 'deposit', amount: 50000 },
  { id: 2, date: '2026-09-17', description: 'Cuota mensual septiembre', member: 'Carlos Rodríguez', type: 'deposit', amount: 50000 },
  { id: 3, date: '2026-09-15', description: 'Préstamo aprobado', member: 'María González', type: 'loan', amount: -300000 },
  { id: 4, date: '2026-09-14', description: 'Pago de intereses', member: 'Luis Herrera', type: 'interest', amount: 15000 },
  { id: 5, date: '2026-09-12', description: 'Cuota mensual septiembre', member: 'Sandra Pérez', type: 'deposit', amount: 50000 },
  { id: 6, date: '2026-09-10', description: 'Abono a préstamo', member: 'María González', type: 'deposit', amount: 80000 },
  { id: 7, date: '2026-09-08', description: 'Cuota mensual septiembre', member: 'Jorge Vargas', type: 'deposit', amount: 50000 },
  { id: 8, date: '2026-09-05', description: 'Multa por mora', member: 'Felipe Torres', type: 'fee', amount: 5000 },
  { id: 9, date: '2026-09-03', description: 'Cuota mensual septiembre', member: 'Valentina Cruz', type: 'deposit', amount: 50000 },
  { id: 10, date: '2026-09-01', description: 'Intereses ganados agosto', member: 'Natillera', type: 'interest', amount: 42000 },
  { id: 11, date: '2026-08-28', description: 'Retiro de utilidades', member: 'Claudia Morales', type: 'withdrawal', amount: -120000 },
  { id: 12, date: '2026-08-20', description: 'Cuota mensual agosto', member: 'Ana Martínez', type: 'deposit', amount: 50000 },
]

export const loans: Loan[] = [
  { id: 1, member: 'María González', amount: 300000, balance: 220000, rate: 2, startDate: '2026-09-15', dueDate: '2026-12-15', status: 'active' },
  { id: 2, member: 'Felipe Torres', amount: 500000, balance: 500000, rate: 2.5, startDate: '2026-08-01', dueDate: '2026-10-01', status: 'overdue' },
  { id: 3, member: 'Jorge Vargas', amount: 150000, balance: 0, rate: 2, startDate: '2026-05-10', dueDate: '2026-08-10', status: 'paid' },
  { id: 4, member: 'Valentina Cruz', amount: 200000, balance: 140000, rate: 2, startDate: '2026-09-01', dueDate: '2026-11-30', status: 'active' },
]

export const activities: Activity[] = [
  { id: 1, date: '2026-09-20', description: 'Reunión mensual de socios', type: 'Reunión', amount: 0, status: 'completed' },
  { id: 2, date: '2026-09-15', description: 'Aprobación préstamo María González', type: 'Aprobación', amount: 300000, status: 'completed' },
  { id: 3, date: '2026-10-05', description: 'Distribución de utilidades Q3', type: 'Distribución', amount: 180000, status: 'pending' },
  { id: 4, date: '2026-08-20', description: 'Reunión mensual de socios', type: 'Reunión', amount: 0, status: 'completed' },
  { id: 5, date: '2026-07-15', description: 'Actualización reglamento interno', type: 'Administrativa', amount: 0, status: 'completed' },
  { id: 6, date: '2026-10-20', description: 'Cierre parcial natillera', type: 'Distribución', amount: 0, status: 'pending' },
]

export const payments: Payment[] = [
  { id: 1, member: 'Ana Martínez', month: 'Sep 2026', amount: 50000, paidDate: '2026-09-18', status: 'paid' },
  { id: 2, member: 'Carlos Rodríguez', month: 'Sep 2026', amount: 50000, paidDate: '2026-09-17', status: 'paid' },
  { id: 3, member: 'María González', month: 'Sep 2026', amount: 50000, paidDate: null, status: 'pending' },
  { id: 4, member: 'Luis Herrera', month: 'Sep 2026', amount: 50000, paidDate: null, status: 'overdue' },
  { id: 5, member: 'Sandra Pérez', month: 'Sep 2026', amount: 50000, paidDate: '2026-09-12', status: 'paid' },
  { id: 6, member: 'Jorge Vargas', month: 'Sep 2026', amount: 50000, paidDate: '2026-09-08', status: 'paid' },
  { id: 7, member: 'Felipe Torres', month: 'Sep 2026', amount: 50000, paidDate: null, status: 'overdue' },
  { id: 8, member: 'Valentina Cruz', month: 'Sep 2026', amount: 50000, paidDate: '2026-09-03', status: 'paid' },
  { id: 9, member: 'Claudia Morales', month: 'Sep 2026', amount: 50000, paidDate: null, status: 'pending' },
]
