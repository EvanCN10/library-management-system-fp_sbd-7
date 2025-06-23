const { connectMySQL, getConnection } = require("../config/mysql")
const { connectMongoDB, getDB } = require("../config/mongodb")

async function dailyOverdueCheck() {
  console.log("📅 Running daily overdue check...")

  try {
    // Connect to databases
    await connectMySQL()
    await connectMongoDB()

    const connection = getConnection()

    // Update status to overdue for books that are past due date
    const [updateOverdue] = await connection.execute(`
      UPDATE borrowing_records 
      SET status = 'overdue' 
      WHERE status = 'borrowed' 
      AND CURDATE() > due_date
    `)

    console.log(`✅ Updated ${updateOverdue.affectedRows} records to overdue status`)

    // Get newly overdue books that don't have fines yet
    const [newlyOverdue] = await connection.execute(`
      SELECT br.id, br.user_id, br.due_date, u.username, b.title,
             DATEDIFF(CURDATE(), br.due_date) as days_overdue
      FROM borrowing_records br
      JOIN users u ON br.user_id = u.id
      JOIN books b ON br.book_id = b.id
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

      console.log(`📚 Fine applied: ${book.username} - ${book.title} (${book.days_overdue} days, $${fineAmount})`)
    }

    console.log(`✅ Applied fines to ${newlyOverdue.length} newly overdue books`)

    // Log the check in MongoDB
    const db = getDB()
    await db.collection("activity_logs").insertOne({
      user_id: null,
      action: "daily_overdue_check",
      details: {
        overdue_status_updated: updateOverdue.affectedRows,
        new_fines_applied: newlyOverdue.length,
        check_date: new Date().toISOString().split("T")[0],
      },
      timestamp: new Date(),
    })

    console.log("🎉 Daily overdue check completed!")
  } catch (error) {
    console.error("❌ Error in daily overdue check:", error)
  }
}

// Load environment variables
require("dotenv").config()
dailyOverdueCheck()
