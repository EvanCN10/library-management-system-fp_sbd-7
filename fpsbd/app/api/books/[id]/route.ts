import { NextResponse } from "next/server"
import { query } from "@/lib/db/mysql"
import { logActivity } from "@/lib/utils"
import type { BookInput } from "@/types"

// GET a book by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const [book] = await query(`SELECT * FROM books WHERE id = ?`, [id])

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 })
  }
}

// PUT update a book
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body: Partial<BookInput> = await request.json()

    // Check if book exists
    const [existingBook] = await query(`SELECT * FROM books WHERE id = ?`, [id])

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (body.title !== undefined) {
      updates.push("title = ?")
      values.push(body.title)
    }

    if (body.author !== undefined) {
      updates.push("author = ?")
      values.push(body.author)
    }

    if (body.isbn !== undefined) {
      updates.push("isbn = ?")
      values.push(body.isbn)
    }

    if (body.publisher !== undefined) {
      updates.push("publisher = ?")
      values.push(body.publisher)
    }

    if (body.category !== undefined) {
      updates.push("category = ?")
      values.push(body.category)
    }

    if (body.year !== undefined) {
      updates.push("year = ?")
      values.push(body.year)
    }

    if (body.copies !== undefined) {
      updates.push("copies = ?")
      values.push(body.copies)

      // Calculate new available copies
      const borrowed = existingBook.copies - existingBook.available
      const newAvailable = Math.max(0, body.copies - borrowed)
      updates.push("available = ?")
      values.push(newAvailable)
    }

    if (body.description !== undefined) {
      updates.push("description = ?")
      values.push(body.description)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add ID to values array for WHERE clause
    values.push(id)

    await query(`UPDATE books SET ${updates.join(", ")} WHERE id = ?`, values)

    // Log activity
    await logActivity("update_book", `Buku "${existingBook.title}" diperbarui`, "book", id)

    const [updatedBook] = await query(`SELECT * FROM books WHERE id = ?`, [id])

    return NextResponse.json(updatedBook)
  } catch (error) {
    console.error("Error updating book:", error)

    // Check for duplicate ISBN
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json({ error: "ISBN already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
  }
}

// DELETE a book
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if book exists and get its title for the activity log
    const [existingBook] = await query(`SELECT * FROM books WHERE id = ?`, [id])

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Check if book is currently borrowed
    const [activeLoan] = await query(
      `
      SELECT * FROM loans 
      WHERE book_id = ? AND status IN ('borrowed', 'overdue')
    `,
      [id],
    )

    if (activeLoan) {
      return NextResponse.json({ error: "Cannot delete book that is currently borrowed" }, { status: 400 })
    }

    await query(`DELETE FROM books WHERE id = ?`, [id])

    // Log activity
    await logActivity("delete_book", `Buku "${existingBook.title}" dihapus`, "book", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
  }
}
