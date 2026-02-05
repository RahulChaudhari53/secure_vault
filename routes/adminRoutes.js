const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const AuditLog = require('../models/AuditLog');

// @desc    Get all system activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
router.get('/logs', protect, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    
    res.json(logs);
  } catch (error) {
    console.error("Fetch Logs Error:", error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

router.all(['/logs'], (req, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
});

module.exports = router;
