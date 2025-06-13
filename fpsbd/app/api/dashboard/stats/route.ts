import { NextResponse } from "next/server"
import { query } from "@/lib/db/mysql"

export async function GET() {
  try {
    // Get total books
    const totalBooksResult = await query<{ total: number }[]>(`
      SELECT COUNT(*) as total FROM books
    `)
    const totalBooks = totalBooksResult[0]?.total || 0

    // Get total members
    const totalMembersResult = await query<{ total: number }[]>(`
      SELECT COUNT(*) as total FROM members WHERE status = 'active'
    `)
    const totalMembers = totalMembersResult[0]?.total || 0

    // Get borrowed books
    const borrowedBooksResult = await query<{ total: number }[]>(`
      SELECT COUNT(*) as total FROM loans WHERE status = 'borrowed'
    `)
    const borrowedBooks = borrowedBooksResult[0]?.total || 0

    // Get overdue books
    const overdueBooksResult = await query<{ total: number }[]>(`
      SELECT COUNT(*) as total FROM loans WHERE status = 'overdue'
    `)
    const overdueBooks = overdueBooksResult[0]?.total || 0

    return NextResponse.json({
      totalBooks,
      totalMembers,
      borrowedBooks,
      overdueBooks,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
