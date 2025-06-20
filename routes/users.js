const express = require("express")
const bcrypt = require("bcryptjs")
const { body, validationResult } = require("express-validator")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const connection = getConnection()
    const [users] = await connection.execute(
      `
            SELECT id, username, email, full_name, phone, address, 
                   role, membership_date, status, created_at
            FROM users WHERE id = ?
        `,
      [req.user.id],
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get borrowing statistics
    const [borrowStats] = await connection.execute(
      `
            SELECT 
                COUNT(*) as total_borrowed,
                SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as currently_borrowed,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_books
            FROM borrowing_records WHERE user_id = ?
        `,
      [req.user.id],
    )

    // Get pending fines
    const [fines] = await connection.execute(
      `
            SELECT SUM(amount) as total_fines
            FROM fines WHERE user_id = ? AND status = 'pending'
        `,
      [req.user.id],
    )

    res.json({
      success: true,
      data: {
        user: users[0],
        statistics: {
          ...borrowStats[0],
          total_fines: fines[0].total_fines || 0,
        },
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    })
  }
})

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  [
    body("full_name").optional().notEmpty().withMessage("Full name cannot be empty"),
    body("email").optional().isEmail().withMessage("Please provide a valid email"),
    body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { full_name, email, phone, address } = req.body
      const connection = getConnection()

      // Check if email is already taken by another user
      if (email) {
        const [existingUsers] = await connection.execute("SELECT id FROM users WHERE email = ? AND id != ?", [
          email,
          req.user.id,
        ])

        if (existingUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Email is already taken",
          })
        }
      }

      await connection.execute(
        `
            UPDATE users SET 
                full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
        [full_name, email, phone, address, req.user.id],
      )

      res.json({
        success: true,
        message: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      })
    }
  },
)

// Change password
router.put(
  "/change-password",
  authenticateToken,
  [
    body("current_password").notEmpty().withMessage("Current password is required"),
    body("new_password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { current_password, new_password } = req.body
      const connection = getConnection()

      // Get current password
      const [users] = await connection.execute("SELECT password FROM users WHERE id = ?", [req.user.id])

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password)
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(new_password, 12)

      // Update password
      await connection.execute("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
        hashedNewPassword,
        req.user.id,
      ])

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: req.user.id,
        action: "password_changed",
        details: { username: req.user.username },
        timestamp: new Date(),
      })

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to change password",
      })
    }
  },
)

// Get all users (Admin/Librarian only)
router.get("/", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query
    const offset = (page - 1) * limit
    const connection = getConnection()

    let query = `
            SELECT id, username, email, full_name, phone, role, 
                   membership_date, status, created_at
            FROM users WHERE 1=1
        `
    const params = []

    if (role) {
      query += " AND role = ?"
      params.push(role)
    }

    if (status) {
      query += " AND status = ?"
      params.push(status)
    }

    if (search) {
      query += " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [users] = await connection.execute(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1"
    const countParams = []

    if (role) {
      countQuery += " AND role = ?"
      countParams.push(role)
    }

    if (status) {
      countQuery += " AND status = ?"
      countParams.push(status)
    }

    if (search) {
      countQuery += " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)"
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const [countResult] = await connection.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    })
  }
})

// Update user status (Admin only)
router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  [body("status").isIn(["active", "inactive", "suspended"]).withMessage("Invalid status")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { id } = req.params
      const { status } = req.body
      const connection = getConnection()

      // Check if user exists
      const [users] = await connection.execute("SELECT username FROM users WHERE id = ?", [id])

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      await connection.execute("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id])

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: req.user.id,
        action: "user_status_updated",
        details: {
          target_user_id: Number.parseInt(id),
          target_username: users[0].username,
          new_status: status,
        },
        timestamp: new Date(),
      })

      res.json({
        success: true,
        message: "User status updated successfully",
      })
    } catch (error) {
      console.error("Update user status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update user status",
      })
    }
  },
)

// Get user fines
router.get("/fines", authenticateToken, async (req, res) => {
  try {
    const connection = getConnection()
    const [fines] = await connection.execute(
      `
            SELECT f.*, br.borrow_date, br.due_date, br.return_date, b.title, b.author
            FROM fines f
            JOIN borrowing_records br ON f.borrowing_record_id = br.id
            JOIN books b ON br.book_id = b.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `,
      [req.user.id],
    )

    res.json({
      success: true,
      data: fines,
    })
  } catch (error) {
    console.error("Get user fines error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch fines",
    })
  }
})

module.exports = router
