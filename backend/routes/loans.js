const express = require('express');
const router = express.Router();
const { executeQuery, getCollection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all loans with optional status filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT l.*, m.name as member_name, b.title as book_title 
      FROM loans l 
      JOIN members m ON l.member_id = m.id 
      JOIN books b ON l.book_id = b.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.borrow_date DESC';

    const loans = await executeQuery(sql, params);
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Create new loan
router.post('/', async (req, res) => {
  try {
    const { member_id, book_id, due_date } = req.body;

    // Validate required fields
    if (!member_id || !book_id || !due_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if book is available
    const books = await executeQuery('SELECT * FROM books WHERE id = ? AND available > 0', [book_id]);
    if (books.length === 0) {
      return res.status(400).json({ error: 'Book not available' });
    }

    // Check if member exists and is active
    const members = await executeQuery("SELECT * FROM members WHERE id = ? AND status = 'active'", [member_id]);
    if (members.length === 0) {
      return res.status(400).json({ error: 'Member not found or inactive' });
    }

    const id = uuidv4();

    // Start transaction-like operations
    // 1. Create loan record
    await executeQuery(
      'INSERT INTO loans (id, member_id, book_id, due_date) VALUES (?, ?, ?, ?)',
      [id, member_id, book_id, due_date]
    );

    // 2. Update book availability
    await executeQuery(
      'UPDATE books SET available = available - 1 WHERE id = ?',
      [book_id]
    );

    // Log activity
    const book = books[0];
    const member = members[0];
    await logActivity('borrow_book', `Buku "${book.title}" dipinjam oleh ${member.name}`, 'loan', id);

    // Get the created loan with member and book details
    const newLoan = await executeQuery(`
      SELECT l.*, m.name as member_name, b.title as book_title 
      FROM loans l 
      JOIN members m ON l.member_id = m.id 
      JOIN books b ON l.book_id = b.id 
      WHERE l.id = ?
    `, [id]);

    res.status(201).json(newLoan[0]);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// Return book
router.put('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if loan exists and is active
    const loans = await executeQuery("SELECT * FROM loans WHERE id = ? AND status = 'borrowed'", [id]);
    if (loans.length === 0) {
      return res.status(404).json({ error: 'Active loan not found' });
    }

    const loan = loans[0];
    const returnDate = new Date();
    const dueDate = new Date(loan.due_date);
    
    // Calculate fine if overdue
    let fine = 0;
    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 1000; // Rp 1000 per day
    }

    // Update loan record
    await executeQuery(
      "UPDATE loans SET return_date = ?, status = 'returned', fine = ? WHERE id = ?",
      [returnDate, fine, id]
    );

    // Update book availability
    await executeQuery(
      'UPDATE books SET available = available + 1 WHERE id = ?',
      [loan.book_id]
    );

    // Get book and member details for logging
    const bookDetails = await executeQuery('SELECT title FROM books WHERE id = ?', [loan.book_id]);
    const memberDetails = await executeQuery('SELECT name FROM members WHERE id = ?', [loan.member_id]);

    // Log activity
    await logActivity(
      'return_book', 
      `Buku "${bookDetails[0].title}" dikembalikan oleh ${memberDetails[0].name}`, 
      'loan', 
      id
    );

    // Get updated loan details
    const updatedLoan = await executeQuery(`
      SELECT l.*, m.name as member_name, b.title as book_title 
      FROM loans l 
      JOIN members m ON l.member_id = m.id 
      JOIN books b ON l.book_id = b.id 
      WHERE l.id = ?
    `, [id]);

    res.json(updatedLoan[0]);
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Failed to return book' });
  }
});

async function logActivity(action, description, entityType, entityId) {
  try {
    const activities = await getCollection('activities');
    await activities.insertOne({
      id: uuidv4(),
      action,
      description,
      entityType,
      entityId,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

module.exports = router;