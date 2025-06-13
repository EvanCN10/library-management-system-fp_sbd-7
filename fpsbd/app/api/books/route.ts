import { NextResponse } from "next/server"
import { query } from "@/lib/db/mysql"
import { generateId, logActivity } from "@/lib/utils"
import type { BookInput } from "@/types"

// GET all books with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const year = searchParams.get("year")

    let sql = `SELECT * FROM books WHERE 1=1`
    const params: any[] = []

    if (search) {
      sql += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (category) {
      sql += ` AND category = ?`
      params.push(category)
    }

    if (year) {
      sql += ` AND year = ?`
      params.push(Number.parseInt(year))
    }

    sql += ` ORDER BY title ASC`

    const books = await query(sql, params)
    return NextResponse.json(books)
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
  }
}

// POST create a new book
export async function POST(request: Request) {
  try {
    const body: BookInput = await request.json()

    // Validate required fields
    if (!body.title || !body.author || !body.isbn || !body.category || !body.year || !body.copies) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const id = generateId()
    const available = body.copies // Initially all copies are available

    await query(
      `
      INSERT INTO books (
        id, title, author, isbn, publisher, category, 
        year, copies, available, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        body.title,
        body.author,
        body.isbn,
        body.publisher || null,
        body.category,
        body.year,
        body.copies,
        available,
        body.description || null,
      ],
    )

    // Log activity
    await logActivity("add_book", `Buku "${body.title}" ditambahkan`, "book", id)

    const [newBook] = await query(`SELECT * FROM books WHERE id = ?`, [id])

    return NextResponse.json(newBook, { status: 201 })
  } catch (error) {
    console.error("Error creating book:", error)

    // Check for duplicate ISBN
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json({ error: "ISBN already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
  }
}
