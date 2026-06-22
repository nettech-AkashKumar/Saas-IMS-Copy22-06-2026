const express = require('express');
const router = express.Router();
const {
  createRewardSystem,
  getAllRewardSystems,
  updateRewardSystem,
  deleteRewardSystem,
  getActiveRewardSystems,
  getDeletedRewardSystems,
  restoreRewardSystem,
} = require('../controllers/Points&RewardsController');
const { verifyToken } = require("../middleware/Authentication/verifyToken.js")
const { authMiddleware } = require('../middleware/auth');

router.post('/create', authMiddleware, createRewardSystem);
router.get('/', authMiddleware, getAllRewardSystems);
router.get('/active-rewards', verifyToken, authMiddleware, getActiveRewardSystems);
router.get("/deleted", verifyToken, authMiddleware, getDeletedRewardSystems);
router.patch("/restore/:id", verifyToken, authMiddleware, restoreRewardSystem);
router.put('/:id', authMiddleware, updateRewardSystem);
router.delete('/:id', authMiddleware, deleteRewardSystem);

module.exports = router;
