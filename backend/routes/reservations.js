const express = require('express');
const router = express.Router();
const { executeQuery, getCollection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all reservations
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT r.*, m.name as member_name, b.title as book_title 
      FROM reservations r 
      JOIN members m ON r.member_id = m.id 
      JOIN books b ON r.book_id = b.id 
      ORDER BY r.reservation_date DESC
    `;

    const reservations = await executeQuery(sql);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Create new reservation
router.post('/', async (req, res) => {
  try {
    const { member_id, book_id } = req.body;

    // Validate required fields
    if (!member_id || !book_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if member exists and is active
    const members = await executeQuery("SELECT * FROM members WHERE id = ? AND status = 'active'", [member_id]);
    if (members.length === 0) {
      return res.status(400).json({ error: 'Member not found or inactive' });
    }

    // Check if book exists
    const books = await executeQuery('SELECT * FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) {
      return res.status(400).json({ error: 'Book not found' });
    }

    // Check if member already has a reservation for this book
    const existingReservation = await executeQuery(
      "SELECT * FROM reservations WHERE member_id = ? AND book_id = ? AND status = 'pending'",
      [member_id, book_id]
    );
    if (existingReservation.length > 0) {
      return res.status(400).json({ error: 'Member already has a pending reservation for this book' });
    }

    const id = uuidv4();

    await executeQuery(
      'INSERT INTO reservations (id, member_id, book_id) VALUES (?, ?, ?)',
      [id, member_id, book_id]
    );

    // Log activity
    const book = books[0];
    const member = members[0];
    await logActivity('add_reservation', `Reservasi buku "${book.title}" oleh ${member.name}`, 'reservation', id);

    // Get the created reservation with member and book details
    const newReservation = await executeQuery(`
      SELECT r.*, m.name as member_name, b.title as book_title 
      FROM reservations r 
      JOIN members m ON r.member_id = m.id 
      JOIN books b ON r.book_id = b.id 
      WHERE r.id = ?
    `, [id]);

    res.status(201).json(newReservation[0]);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

// Update reservation status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if reservation exists
    const reservations = await executeQuery('SELECT * FROM reservations WHERE id = ?', [id]);
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await executeQuery(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, id]
    );

    // Log activity
    const reservation = reservations[0];
    const bookDetails = await executeQuery('SELECT title FROM books WHERE id = ?', [reservation.book_id]);
    const memberDetails = await executeQuery('SELECT name FROM members WHERE id = ?', [reservation.member_id]);

    await logActivity(
      'update_reservation', 
      `Reservasi buku "${bookDetails[0].title}" oleh ${memberDetails[0].name} ${status === 'fulfilled' ? 'dipenuhi' : 'dibatalkan'}`, 
      'reservation', 
      id
    );

    // Get updated reservation details
    const updatedReservation = await executeQuery(`
      SELECT r.*, m.name as member_name, b.title as book_title 
      FROM reservations r 
      JOIN members m ON r.member_id = m.id 
      JOIN books b ON r.book_id = b.id 
      WHERE r.id = ?
    `, [id]);

    res.json(updatedReservation[0]);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
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