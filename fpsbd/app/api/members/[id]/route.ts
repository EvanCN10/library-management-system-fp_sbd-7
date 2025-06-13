import { NextResponse } from "next/server"
import { query } from "@/lib/db/mysql"
import { logActivity } from "@/lib/utils"
import type { MemberInput } from "@/types"

// GET a member by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const [member] = await query(`SELECT * FROM members WHERE id = ?`, [id])

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 })
  }
}

// PUT update a member
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body: Partial<MemberInput> = await request.json()

    // Check if member exists
    const [existingMember] = await query(`SELECT * FROM members WHERE id = ?`, [id])

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (body.name !== undefined) {
      updates.push("name = ?")
      values.push(body.name)
    }

    if (body.email !== undefined) {
      updates.push("email = ?")
      values.push(body.email)
    }

    if (body.phone !== undefined) {
      updates.push("phone = ?")
      values.push(body.phone)
    }

    if (body.address !== undefined) {
      updates.push("address = ?")
      values.push(body.address)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add ID to values array for WHERE clause
    values.push(id)

    await query(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`, values)

    // Log activity
    await logActivity("update_member", `Anggota "${existingMember.name}" diperbarui`, "member", id)

    const [updatedMember] = await query(`SELECT * FROM members WHERE id = ?`, [id])

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating member:", error)

    // Check for duplicate email
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

// DELETE a member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const i
