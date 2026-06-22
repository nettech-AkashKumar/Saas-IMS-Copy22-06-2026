const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/Authentication/verifyToken');
const { authMiddleware } = require("../middleware/auth.js");
const {
  createPosReturn,
  getPosReturns,
  getPosReturnById,
} = require('../controllers/posReturnController');

router.use(verifyToken);

router.post('/create', authMiddleware, createPosReturn);
router.get('/', authMiddleware, getPosReturns);
router.get('/:id', authMiddleware, getPosReturnById);

module.exports = router;
