const express = require("express")
const { body, validationResult } = require("express-validator")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Borrow a book
router.post(
  "/borrow",
  authenticateToken,
  [
    body("book_id").isInt().withMessage("Valid book ID is required"),
    body("due_date").isISO8601().withMessage("Valid due date is required"),
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

      const { book_id, due_date } = req.body
      const user_id = req.user.id
      const connection = getConnection()

      // Check if book exists and is available
      const [books] = await connection.execute("SELECT id, title, available_copies FROM books WHERE id = ?", [book_id])

      if (books.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        })
      }

      if (books[0].available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: "Book is not available for borrowing",
        })
      }

      // Check if user already has this book borrowed
      const [existingBorrowings] = await connection.execute(
        'SELECT id FROM borrowing_records WHERE user_id = ? AND book_id = ? AND status = "borrowed"',
        [user_id, book_id],
      )

      if (existingBorrowings.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You already have this book borrowed",
        })
      }

      // Check borrowing limit (max 5 books per user)
      const [userBorrowings] = await connection.execute(
        'SELECT COUNT(*) as count FROM borrowing_records WHERE user_id = ? AND status = "borrowed"',
        [user_id],
      )

      if (userBorrowings[0].count >= 5) {
        return res.status(400).json({
          success: false,
          message: "You have reached the maximum borrowing limit (5 books)",
        })
      }

      // Start transaction
      await connection.beginTransaction()

      try {
        // Create borrowing record
        const [borrowResult] = await connection.execute(
          `
                INSERT INTO borrowing_records (user_id, book_id, borrow_date, due_date, status)
                VALUES (?, ?, CURDATE(), ?, 'borrowed')
            `,
          [user_id, book_id, due_date],
        )

        // Update book available copies
        await connection.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id])

        await connection.commit()

        // Log activity in MongoDB
        const db = getDB()
        await db.collection("activity_logs").insertOne({
          user_id: user_id,
          action: "book_borrowed",
          details: {
            book_id: book_id,
            book_title: books[0].title,
            borrowing_id: borrowResult.insertId,
            due_date: due_date,
          },
          timestamp: new Date(),
        })

        res.status(201).json({
          success: true,
          message: "Book borrowed successfully",
          data: { borrowing_id: borrowResult.insertId },
        })
      } catch (error) {
        await connection.rollback()
        throw error
      }
    } catch (error) {
      console.error("Borrow book error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to borrow book",
      })
    }
  },
)

// Return a book
router.post(
  "/return",
  authenticateToken,
  [body("borrowing_id").isInt().withMessage("Valid borrowing ID is required")],
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

      const { borrowing_id } = req.body
      const user_id = req.user.id
      const connection = getConnection()

      // Get borrowing record
      const [borrowings] = await connection.execute(
        `
            SELECT br.*, b.title, b.id as book_id
            FROM borrowing_records br
            JOIN books b ON br.book_id = b.id
            WHERE br.id = ? AND br.user_id = ? AND br.status = 'borrowed'
        `,
        [borrowing_id, user_id],
      )

      if (borrowings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Borrowing record not found or already returned",
        })
      }

      const borrowing = borrowings[0]
      const returnDate = new Date()
      const dueDate = new Date(borrowing.due_date)

      // Calculate fine if overdue
      let fineAmount = 0
      if (returnDate > dueDate) {
        const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
        fineAmount = daysOverdue * 1000 // 1000 per day fine
      }

      // Start transaction
      await connection.beginTransaction()

      try {
        // Update borrowing record
        await connection.execute(
          `
                UPDATE borrowing_records 
                SET return_date = CURDATE(), status = 'returned', fine_amount = ?
                WHERE id = ?
            `,
          [fineAmount, borrowing_id],
        )

        // Update book available copies
        await connection.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [
          borrowing.book_id,
        ])

        // Create fine record if applicable
        if (fineAmount > 0) {
          await connection.execute(
            `
                    INSERT INTO fines (user_id, borrowing_record_id, amount, reason, status)
                    VALUES (?, ?, ?, 'Overdue return', 'pending')
                `,
            [user_id, borrowing_id, fineAmount],
          )
        }

        await connection.commit()

        // Log activity in MongoDB
        const db = getDB()
        await db.collection("activity_logs").insertOne({
          user_id: user_id,
          action: "book_returned",
          details: {
            book_id: borrowing.book_id,
            book_title: borrowing.title,
            borrowing_id: borrowing_id,
            fine_amount: fineAmount,
            return_date: returnDate,
          },
          timestamp: new Date(),
        })

        res.json({
          success: true,
          message: "Book returned successfully",
          data: {
            fine_amount: fineAmount,
            message: fineAmount > 0 ? `Fine of ${fineAmount} applied for overdue return` : "No fine applied",
          },
        })
      } catch (error) {
        await connection.rollback()
        throw error
      }
    } catch (error) {
      console.error("Return book error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to return book",
      })
    }
  },
)

// Get user's borrowing history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const offset = (page - 1) * limit
    const user_id = req.user.id
    const connection = getConnection()

    let query = `
            SELECT br.*, b.title, b.author, b.isbn
            FROM borrowing_records br
            JOIN books b ON br.book_id = b.id
            WHERE br.user_id = ?
        `
    const params = [user_id]

    if (status) {
      query += " AND br.status = ?"
      params.push(status)
    }

    query += " ORDER BY br.created_at DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [borrowings] = await connection.execute(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM borrowing_records WHERE user_id = ?"
    const countParams = [user_id]

    if (status) {
      countQuery += " AND status = ?"
      countParams.push(status)
    }

    const [countResult] = await connection.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      success: true,
      data: {
        borrowings,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get borrowing history error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowing history",
    })
  }
})

// Get all borrowings (Admin/Librarian only)
router.get("/all", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query
    const offset = (page - 1) * limit
    const connection = getConnection()

    let query = `
            SELECT br.*, b.title, b.author, b.isbn, u.username, u.full_name
            FROM borrowing_records br
            JOIN books b ON br.book_id = b.id
            JOIN users u ON br.user_id = u.id
            WHERE 1=1
        `
    const params = []

    if (status) {
      query += " AND br.status = ?"
      params.push(status)
    }

    if (user_id) {
      query += " AND br.user_id = ?"
      params.push(user_id)
    }

    query += " ORDER BY br.created_at DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [borrowings] = await connection.execute(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM borrowing_records br WHERE 1=1"
    const countParams = []

    if (status) {
      countQuery += " AND br.status = ?"
      countParams.push(status)
    }

    if (user_id) {
      countQuery += " AND br.user_id = ?"
      countParams.push(user_id)
    }

    const [countResult] = await connection.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      success: true,
      data: {
        borrowings,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get all borrowings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowings",
    })
  }
})

// Update borrowing status (Admin/Librarian only)
router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin", "librarian"),
  [body("status").isIn(["borrowed", "returned", "overdue"]).withMessage("Invalid status")],
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

      await connection.execute("UPDATE borrowing_records SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
        status,
        id,
      ])

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: req.user.id,
        action: "borrowing_status_updated",
        details: {
          borrowing_id: Number.parseInt(id),
          new_status: status,
        },
        timestamp: new Date(),
      })

      res.json({
        success: true,
        message: "Borrowing status updated successfully",
      })
    } catch (error) {
      console.error("Update borrowing status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update borrowing status",
      })
    }
  },
)

module.exports = router
