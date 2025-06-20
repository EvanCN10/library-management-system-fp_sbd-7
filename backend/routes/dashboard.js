const express = require('express');
const router = express.Router();
const { executeQuery, getCollection } = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total books
    const totalBooksResult = await executeQuery('SELECT COUNT(*) as total FROM books');
    const totalBooks = totalBooksResult[0]?.total || 0;

    // Get total members
    const totalMembersResult = await executeQuery("SELECT COUNT(*) as total FROM members WHERE status = 'active'");
    const totalMembers = totalMembersResult[0]?.total || 0;

    // Get borrowed books
    const borrowedBooksResult = await executeQuery("SELECT COUNT(*) as total FROM loans WHERE status = 'borrowed'");
    const borrowedBooks = borrowedBooksResult[0]?.total || 0;

    // Get overdue books
    const overdueBooksResult = await executeQuery("SELECT COUNT(*) as total FROM loans WHERE status = 'overdue'");
    const overdueBooks = overdueBooksResult[0]?.total || 0;

    res.json({
      totalBooks,
      totalMembers,
      borrowedBooks,
      overdueBooks
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const activities = await getCollection('activities');
    const recentActivities = await activities
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Format activities for frontend
    const formattedActivities = recentActivities.map(activity => {
      let icon = 'fa-info-circle';
      let type = 'info';

      if (activity.action.includes('add') || activity.action.includes('create')) {
        icon = 'fa-plus';
        type = 'success';
      } else if (activity.action.includes('update') || activity.action.includes('edit')) {
        icon = 'fa-edit';
        type = 'info';
      } else if (activity.action.includes('delete') || activity.action.includes('remove')) {
        icon = 'fa-trash';
        type = 'danger';
      } else if (activity.action.includes('borrow')) {
        icon = 'fa-exchange-alt';
        type = 'warning';
      } else if (activity.action.includes('return')) {
        icon = 'fa-undo';
        type = 'success';
      }

      return {
        id: activity.id,
        icon,
        text: activity.description,
        time: getRelativeTime(activity.createdAt),
        type
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

function getRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();

  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec} detik lalu`;
  } else if (diffMin < 60) {
    return `${diffMin} menit lalu`;
  } else if (diffHour < 24) {
    return `${diffHour} jam lalu`;
  } else if (diffDay < 30) {
    return `${diffDay} hari lalu`;
  } else {
    return new Date(date).toLocaleDateString('id-ID');
  }
}

module.exports = router;