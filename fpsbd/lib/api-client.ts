import type {
  DashboardStats,
  Activity,
  Book,
  BookInput,
  Member,
  MemberInput,
  Loan,
  LoanInput,
  Reservation,
  ReservationInput,
} from "@/types"

// Base API URL
const API_URL = "/api"

// Error handling helper
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "An error occurred")
  }
  return response.json()
}

// Dashboard API calls
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_URL}/dashboard/stats`)
  return handleResponse(response)
}

export const fetchRecentActivities = async (): Promise<Activity[]> => {
  const response = await fetch(`${API_URL}/dashboard/activities`)
  return handleResponse(response)
}

// Books API calls
export const fetchBooks = async (search?: string, category?: string, year?: string): Promise<Book[]> => {
  let url = `${API_URL}/books`
  const params = new URLSearchParams()

  if (search) params.append("search", search)
  if (category) params.append("category", category)
  if (year) params.append("year", year)

  if (params.toString()) {
    url += `?${params.toString()}`
  }

  const response = await fetch(url)
  return handleResponse(response)
}

export const fetchBookById = async (id: string): Promise<Book> => {
  const response = await fetch(`${API_URL}/books/${id}`)
  return handleResponse(response)
}

export const createBook = async (book: BookInput): Promise<Book> => {
  const response = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  })
  return handleResponse(response)
}

export const updateBook = async (id: string, book: Partial<BookInput>): Promise<Book> => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  })
  return handleResponse(response)
}

export const deleteBook = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: "DELETE",
  })
  return handleResponse(response)
}

// Members API calls
export const fetchMembers = async (search?: string): Promise<Member[]> => {
  let url = `${API_URL}/members`

  if (search) {
    url += `?search=${encodeURIComponent(search)}`
  }

  const response = await fetch(url)
  return handleResponse(response)
}

export const fetchMemberById = async (id: string): Promise<Member> => {
  const response = await fetch(`${API_URL}/members/${id}`)
  return handleResponse(response)
}

export const createMember = async (member: MemberInput): Promise<Member> => {
  const response = await fetch(`${API_URL}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  })
  return handleResponse(response)
}

export const updateMember = async (id: string, member: Partial<MemberInput>): Promise<Member> => {
  const response = await fetch(`${API_URL}/members/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  })
  return handleResponse(response)
}

export const deleteMember = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/members/${id}`, {
    method: "DELETE",
  })
  return handleResponse(response)
}

// Loans API calls
export const fetchLoans = async (status?: "borrowed" | "returned" | "overdue"): Promise<Loan[]> => {
  let url = `${API_URL}/loans`

  if (status) {
    url += `?status=${status}`
  }

  const response = await fetch(url)
  return handleResponse(response)
}

export const createLoan = async (loan: LoanInput): Promise<Loan> => {
  const response = await fetch(`${API_URL}/loans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loan),
  })
  return handleResponse(response)
}

export const returnBook = async (id: string): Promise<Loan> => {
  const response = await fetch(`${API_URL}/loans/${id}/return`, {
    method: "PUT",
  })
  return handleResponse(response)
}

// Reservations API calls
export const fetchReservations = async (): Promise<Reservation[]> => {
  const response = await fetch(`${API_URL}/reservations`)
  return handleResponse(response)
}

export const createReservation = async (reservation: ReservationInput): Promise<Reservation> => {
  const response = await fetch(`${API_URL}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reservation),
  })
  return handleResponse(response)
}

export const updateReservationStatus = async (id: string, status: "fulfilled" | "cancelled"): Promise<Reservation> => {
  const response = await fetch(`${API_URL}/reservations/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return handleResponse(response)
}
