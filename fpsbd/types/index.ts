// Dashboard Types
export interface DashboardStats {
  totalBooks: number
  totalMembers: number
  borrowedBooks: number
  overdueBooks: number
}

export interface Activity {
  id: string
  icon: string
  text: string
  time: string
  type: "success" | "info" | "warning" | "danger"
}

// Book Types
export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publisher?: string
  category: string
  year: number
  copies: number
  available: number
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface BookInput {
  title: string
  author: string
  isbn: string
  publisher?: string
  category: string
  year: number
  copies: number
  description?: string
}

// Member Types
export interface Member {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  joinDate: Date
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export interface MemberInput {
  name: string
  email: string
  phone: string
  address?: string
}

// Loan Types
export interface Loan {
  id: string
  memberId: string
  memberName: string
  bookId: string
  bookTitle: string
  borrowDate: Date
  dueDate: Date
  returnDate?: Date
  status: "borrowed" | "returned" | "overdue"
  fine?: number
  createdAt: Date
  updatedAt: Date
}

export interface LoanInput {
  memberId: string
  bookId: string
  dueDate: string
}

// Reservation Types
export interface Reservation {
  id: string
  memberId: string
  memberName: string
  bookId: string
  bookTitle: string
  reservationDate: Date
  status: "pending" | "fulfilled" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

export interface ReservationInput {
  memberId: string
  bookId: string
}
