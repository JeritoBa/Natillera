export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'Member'
  isActive: boolean
}

export interface MemberFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
}
