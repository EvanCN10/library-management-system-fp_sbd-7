const express = require("express")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Dashboard statistics (Admin/Librarian only)
router.get("/dashboard", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const connection = getConnection()

    // Get basic statistics
    const [totalBooks] = await connection.execute("SELECT COUNT(*) as count FROM books")
    const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "member"')
    const [activeBorrowings] = await connection.execute(
      'SELECT COUNT(*) as count FROM borrowing_records WHERE status = "borrowed"',
    )
    const [overdueBorrowings] = await connection.execute(
      'SELECT COUNT(*) as count FROM borrowing_records WHERE status = "overdue"',
    )
    const [pendingFines] = await connection.execute('SELECT SUM(amount) as total FROM fines WHERE status = "pending"')

    // Get monthly borrowing statistics
    const [monthlyStats] = await connection.execute(`
            SELECT 
                MONTH(borrow_date) as month,
                YEAR(borrow_date) as year,
                COUNT(*) as borrowings
            FROM borrowing_records 
            WHERE borrow_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY YEAR(borrow_date), MONTH(borrow_date)
            ORDER BY year DESC, month DESC
        `)

    // Get most borrowed books
    const [popularBooks] = await connection.execute(`
            SELECT b.title, b.author, COUNT(br.id) as borrow_count
            FROM books b
            JOIN borrowing_records br ON b.id = br.book_id
            GROUP BY b.id
            ORDER BY borrow_count DESC
            LIMIT 10
        `)

    // Get category statistics
    const [categoryStats] = await connection.execute(`
            SELECT c.name, COUNT(b.id) as book_count, COUNT(br.id) as borrow_count
            FROM categories c
            LEFT JOIN books b ON c.id = b.category_id
            LEFT JOIN borrowing_records br ON b.id = br.book_id
            GROUP BY c.id
            ORDER BY borrow_count DESC
        `)

    res.json({
      success: true,
      data: {
        overview: {
          total_books: totalBooks[0].count,
          total_users: totalUsers[0].count,
          active_borrowings: activeBorrowings[0].count,
          overdue_borrowings: overdueBorrowings[0].count,
          pending_fines: pendingFines[0].total || 0,
        },
        monthly_stats: monthlyStats,
        popular_books: popularBooks,
        category_stats: categoryStats,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    })
  }
})

// Borrowing report
router.get("/borrowings", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query
    const connection = getConnection()

    let query = `
            SELECT br.*, b.title, b.author, u.username, u.full_name
            FROM borrowing_records br
            JOIN books b ON br.book_id = b.id
            JOIN users u ON br.user_id = u.id
            WHERE 1=1
        `
    const params = []

    if (start_date) {
      query += " AND br.borrow_date >= ?"
      params.push(start_date)
    }

    if (end_date) {
      query += " AND br.borrow_date <= ?"
      params.push(end_date)
    }

    if (status) {
      query += " AND br.status = ?"
      params.push(status)
    }

    query += " ORDER BY br.borrow_date DESC"

    const [borrowings] = await connection.execute(query, params)

    res.json({
      success: true,
      data: borrowings,
    })
  } catch (error) {
    console.error("Borrowing report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate borrowing report",
    })
  }
})

// Overdue books report
router.get("/overdue", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const connection = getConnection()

    const [overdueBooks] = await connection.execute(`
            SELECT br.*, b.title, b.author, u.username, u.full_name, u.email, u.phone,
                   CASE 
                     WHEN CURDATE() > br.due_date THEN DATEDIFF(CURDATE(), br.due_date)
                     ELSE 0
                   END as days_overdue
            FROM borrowing_records br
            JOIN books b ON br.book_id = b.id
            JOIN users u ON br.user_id = u.id
            WHERE br.status IN ('borrowed', 'overdue') 
            AND CURDATE() > br.due_date
            ORDER BY days_overdue DESC
        `)

    res.json({
      success: true,
      data: overdueBooks,
    })
  } catch (error) {
    console.error("Overdue report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate overdue report",
    })
  }
})

// User activity report
router.get("/user-activity", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query
    const db = getDB()

    const matchQuery = {}

    if (user_id) {
      matchQuery.user_id = Number.parseInt(user_id)
    }

    if (start_date || end_date) {
      matchQuery.timestamp = {}
      if (start_date) {
        matchQuery.timestamp.$gte = new Date(start_date)
      }
      if (end_date) {
        matchQuery.timestamp.$lte = new Date(end_date)
      }
    }

    const activities = await db
      .collection("activity_logs")
      .find(matchQuery)
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray()

    res.json({
      success: true,
      data: activities,
    })
  } catch (error) {
    console.error("User activity report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate user activity report",
    })
  }
})

// Fine report
router.get("/fines", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query
    const connection = getConnection()

    let query = `
            SELECT f.*, u.username, u.full_name, u.email, b.title, b.author
            FROM fines f
            JOIN users u ON f.user_id = u.id
            JOIN borrowing_records br ON f.borrowing_record_id = br.id
            JOIN books b ON br.book_id = b.id
            WHERE 1=1
        `
    const params = []

    if (status) {
      query += " AND f.status = ?"
      params.push(status)
    }

    if (start_date) {
      query += " AND f.created_at >= ?"
      params.push(start_date)
    }

    if (end_date) {
      query += " AND f.created_at <= ?"
      params.push(end_date)
    }

    query += " ORDER BY f.created_at DESC"

    const [fines] = await connection.execute(query, params)

    // Calculate totals
    const totalAmount = fines.reduce((sum, fine) => sum + Number.parseFloat(fine.amount), 0)
    const paidAmount = fines
      .filter((fine) => fine.status === "paid")
      .reduce((sum, fine) => sum + Number.parseFloat(fine.amount), 0)
    const pendingAmount = fines
      .filter((fine) => fine.status === "pending")
      .reduce((sum, fine) => sum + Number.parseFloat(fine.amount), 0)

    res.json({
      success: true,
      data: {
        fines,
        summary: {
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          total_fines: fines.length,
        },
      },
    })
  } catch (error) {
    console.error("Fine report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate fine report",
    })
  }
})

// Manual overdue check (Admin only)
router.post("/check-overdue", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const connection = getConnection()

    // Update status to overdue for books that are past due date
    const [updateOverdue] = await connection.execute(`
      UPDATE borrowing_records 
      SET status = 'overdue' 
      WHERE status = 'borrowed' 
      AND CURDATE() > due_date
    `)

    // Get newly overdue books that don't have fines yet
    const [newlyOverdue] = await connection.execute(`
      SELECT br.id, br.user_id, br.due_date,
             DATEDIFF(CURDATE(), br.due_date) as days_overdue
      FROM borrowing_records br
      LEFT JOIN fines f ON br.id = f.borrowing_record_id AND f.reason = 'Overdue return'
      WHERE br.status = 'overdue' 
      AND f.id IS NULL
      AND DATEDIFF(CURDATE(), br.due_date) > 0
    `)

    // Create fine records for newly overdue books
    for (const book of newlyOverdue) {
      const fineAmount = book.days_overdue * 1000 // 1000 per day

      // Update borrowing record with fine amount
      await connection.execute(
        `
        UPDATE borrowing_records 
        SET fine_amount = ? 
        WHERE id = ?
      `,
        [fineAmount, book.id],
      )

      // Create fine record
      await connection.execute(
        `
        INSERT INTO fines (user_id, borrowing_record_id, amount, reason, status)
        VALUES (?, ?, ?, 'Overdue return', 'pending')
      `,
        [book.user_id, book.id, fineAmount],
      )
    }

    // Log activity in MongoDB
    const db = getDB()
    await db.collection("activity_logs").insertOne({
      user_id: req.user.id,
      action: "manual_overdue_check",
      details: {
        overdue_status_updated: updateOverdue.affectedRows,
        new_fines_applied: newlyOverdue.length,
      },
      timestamp: new Date(),
    })

    res.json({
      success: true,
      message: "Overdue check completed successfully",
      data: {
        overdue_status_updated: updateOverdue.affectedRows,
        new_fines_applied: newlyOverdue.length,
      },
    })
  } catch (error) {
    console.error("Manual overdue check error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to run overdue check",
    })
  }
})

module.exports = router
