const express = require('express');
const router = express.Router();
const { executeQuery, getCollection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all books with optional filtering
router.get('/', async (req, res) => {
  try {
    const { search, category, year } = req.query;
    
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (year) {
      sql += ' AND year = ?';
      params.push(parseInt(year));
    }

    sql += ' ORDER BY title ASC';

    const books = await executeQuery(sql, params);
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const books = await executeQuery('SELECT * FROM books WHERE id = ?', [id]);
    
    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(books[0]);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Create new book
router.post('/', async (req, res) => {
  try {
    const { title, author, isbn, publisher, category, year, copies, description } = req.body;

    // Validate required fields
    if (!title || !author || !isbn || !category || !year || !copies) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const available = copies; // Initially all copies are available

    await executeQuery(
      `INSERT INTO books (id, title, author, isbn, publisher, category, year, copies, available, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, author, isbn, publisher || null, category, year, copies, available, description || null]
    );

    // Log activity
    await logActivity('add_book', `Buku "${title}" ditambahkan`, 'book', id);

    const newBook = await executeQuery('SELECT * FROM books WHERE id = ?', [id]);
    res.status(201).json(newBook[0]);
  } catch (error) {
    console.error('Error creating book:', error);
    
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'ISBN already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if book exists
    const existingBooks = await executeQuery('SELECT * FROM books WHERE id = ?', [id]);
    if (existingBooks.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const existingBook = existingBooks[0];

    // Build update query dynamically
    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Handle copies update
    if (updates.copies !== undefined) {
      const borrowed = existingBook.copies - existingBook.available;
      const newAvailable = Math.max(0, updates.copies - borrowed);
      
      const availableIndex = updateFields.findIndex(field => field.includes('available'));
      if (availableIndex === -1) {
        updateFields.push('available = ?');
        values.push(newAvailable);
      } else {
        values[availableIndex] = newAvailable;
      }
    }

    values.push(id);

    await executeQuery(
      `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    // Log activity
    await logActivity('update_book', `Buku "${existingBook.title}" diperbarui`, 'book', id);

    const updatedBook = await executeQuery('SELECT * FROM books WHERE id = ?', [id]);
    res.json(updatedBook[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'ISBN already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const existingBooks = await executeQuery('SELECT * FROM books WHERE id = ?', [id]);
    if (existingBooks.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const existingBook = existingBooks[0];

    // Check if book is currently borrowed
    const activeLoans = await executeQuery(
      "SELECT * FROM loans WHERE book_id = ? AND status IN ('borrowed', 'overdue')",
      [id]
    );

    if (activeLoans.length > 0) {
      return res.status(400).json({ error: 'Cannot delete book that is currently borrowed' });
    }

    await executeQuery('DELETE FROM books WHERE id = ?', [id]);

    // Log activity
    await logActivity('delete_book', `Buku "${existingBook.title}" dihapus`, 'book', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
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