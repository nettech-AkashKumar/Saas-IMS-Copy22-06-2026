const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/stock/summary
router.get('/summary', authMiddleware, stockController.getStockSummary);

module.exports = router;
