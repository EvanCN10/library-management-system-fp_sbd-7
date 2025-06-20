const express = require('express');
const router = express.Router();
const { executeQuery, getCollection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all members with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let sql = 'SELECT * FROM members';
    const params = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY name ASC';

    const members = await executeQuery(sql, params);
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const members = await executeQuery('SELECT * FROM members WHERE id = ?', [id]);
    
    if (members.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(members[0]);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// Create new member
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();

    await executeQuery(
      'INSERT INTO members (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, phone, address || null]
    );

    // Log activity
    await logActivity('add_member', `Anggota "${name}" terdaftar`, 'member', id);

    const newMember = await executeQuery('SELECT * FROM members WHERE id = ?', [id]);
    res.status(201).json(newMember[0]);
  } catch (error) {
    console.error('Error creating member:', error);
    
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if member exists
    const existingMembers = await executeQuery('SELECT * FROM members WHERE id = ?', [id]);
    if (existingMembers.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const existingMember = existingMembers[0];

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

    values.push(id);

    await executeQuery(
      `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    // Log activity
    await logActivity('update_member', `Anggota "${existingMember.name}" diperbarui`, 'member', id);

    const updatedMember = await executeQuery('SELECT * FROM members WHERE id = ?', [id]);
    res.json(updatedMember[0]);
  } catch (error) {
    console.error('Error updating member:', error);
    
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const existingMembers = await executeQuery('SELECT * FROM members WHERE id = ?', [id]);
    if (existingMembers.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const existingMember = existingMembers[0];

    // Check if member has active loans
    const activeLoans = await executeQuery(
      "SELECT * FROM loans WHERE member_id = ? AND status IN ('borrowed', 'overdue')",
      [id]
    );

    if (activeLoans.length > 0) {
      return res.status(400).json({ error: 'Cannot delete member with active loans' });
    }

    await executeQuery('DELETE FROM members WHERE id = ?', [id]);

    // Log activity
    await logActivity('delete_member', `Anggota "${existingMember.name}" dihapus`, 'member', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
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