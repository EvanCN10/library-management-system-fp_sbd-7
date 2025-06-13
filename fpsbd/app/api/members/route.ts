import { NextResponse } from "next/server"
import { query } from "@/lib/db/mysql"
import { generateId, logActivity } from "@/lib/utils"
import type { MemberInput } from "@/types"

// GET all members with optional search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let sql = `SELECT * FROM members`
    const params: any[] = []

    if (search) {
      sql += ` WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    sql += ` ORDER BY name ASC`

    const members = await query(sql, params)
    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

// POST create a new member
export async function POST(request: Request) {
  try {
    const body: MemberInput = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const id = generateId()

    await query(
      `
      INSERT INTO members (
        id, name, email, phone, address
      ) VALUES (?, ?, ?, ?, ?)
    `,
      [id, body.name, body.email, body.phone, body.address || null],
    )

    // Log activity
    await logActivity("add_member", `Anggota "${body.name}" terdaftar`, "member", id)

    const [newMember] = await query(`SELECT * FROM members WHERE id = ?`, [id])

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error("Error creating member:", error)

    // Check for duplicate email
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
