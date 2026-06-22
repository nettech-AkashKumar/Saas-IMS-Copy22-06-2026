const express = require('express');
const router = express.Router();
const { getInventorySummary } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

router.get('/inventory-summary', authMiddleware, getInventorySummary);

module.exports = router;
