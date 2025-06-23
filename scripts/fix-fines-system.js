const { connectMySQL, getConnection } = require("../config/mysql")
const { connectMongoDB, getDB } = require("../config/mongodb")

async function fixFinesSystem() {
  console.log("🔧 Fixing fines system...")

  try {
    // Connect to databases
    await connectMySQL()
    await connectMongoDB()

    const connection = getConnection()

    console.log("1. Removing incorrect fines for on-time returns...")

    // Remove fines for books returned on time
    const [incorrectFines] = await connection.execute(`
      DELETE f FROM fines f
      JOIN borrowing_records br ON f.borrowing_record_id = br.id
      WHERE br.return_date IS NOT NULL 
      AND br.return_date <= br.due_date
      AND f.reason = 'Overdue return'
    `)

    console.log(`✅ Removed ${incorrectFines.affectedRows} incorrect fines`)

    console.log("2. Resetting fine amounts for on-time returns...")

    // Reset fine amounts for on-time returns
    const [resetFines] = await connection.execute(`
      UPDATE borrowing_records 
      SET fine_amount = 0 
      WHERE return_date IS NOT NULL 
      AND return_date <= due_date
    `)

    console.log(`✅ Reset ${resetFines.affectedRows} fine amounts`)

    console.log("3. Updating overdue status...")

    // Update status to overdue for books that are actually overdue
    const [updateOverdue] = await connection.execute(`
      UPDATE borrowing_records 
      SET status = 'overdue' 
      WHERE status = 'borrowed' 
      AND CURDATE() > due_date
    `)

    console.log(`✅ Updated ${updateOverdue.affectedRows} records to overdue status`)

    console.log("4. Calculating correct fines for overdue books...")

    // Calculate and apply correct fines for actually overdue books
    const [overdueBooks] = await connection.execute(`
      SELECT id, user_id, DATEDIFF(COALESCE(return_date, CURDATE()), due_date) as days_overdue
      FROM borrowing_records 
      WHERE (status = 'overdue' OR (return_date IS NOT NULL AND return_date > due_date))
      AND DATEDIFF(COALESCE(return_date, CURDATE()), due_date) > 0
    `)

    for (const book of overdueBooks) {
      const fineAmount = book.days_overdue * 1000 // 1000 per day

      // Update borrowing record with correct fine
      await connection.execute(
        `
        UPDATE borrowing_records 
        SET fine_amount = ? 
        WHERE id = ?
      `,
        [fineAmount, book.id],
      )

      // Check if fine record exists
      const [existingFine] = await connection.execute(
        `
        SELECT id FROM fines 
        WHERE borrowing_record_id = ? AND reason = 'Overdue return'
      `,
        [book.id],
      )

      if (existingFine.length === 0) {
        // Create fine record if it doesn't exist
        await connection.execute(
          `
          INSERT INTO fines (user_id, borrowing_record_id, amount, reason, status)
          VALUES (?, ?, ?, 'Overdue return', 'pending')
        `,
          [book.user_id, book.id, fineAmount],
        )
      } else {
        // Update existing fine record
        await connection.execute(
          `
          UPDATE fines 
          SET amount = ? 
          WHERE borrowing_record_id = ? AND reason = 'Overdue return'
        `,
          [fineAmount, book.id],
        )
      }
    }

    console.log(`✅ Processed ${overdueBooks.length} overdue books`)

    console.log("🎉 Fines system fixed successfully!")

    // Log the fix in MongoDB
    const db = getDB()
    await db.collection("activity_logs").insertOne({
      user_id: null,
      action: "system_fines_fixed",
      details: {
        incorrect_fines_removed: incorrectFines.affectedRows,
        fine_amounts_reset: resetFines.affectedRows,
        overdue_status_updated: updateOverdue.affectedRows,
        overdue_books_processed: overdueBooks.length,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("❌ Error fixing fines system:", error)
  }
}

// Load environment variables
require("dotenv").config()
fixFinesSystem()
