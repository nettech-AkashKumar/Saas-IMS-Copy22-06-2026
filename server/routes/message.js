const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, messageController.saveMessage);
router.get('/', authMiddleware, messageController.getMessages);
router.post('/read', authMiddleware, messageController.markAsRead);
router.delete('/clear', authMiddleware, messageController.clearMessages);
router.delete('/delete-user-messages', authMiddleware, messageController.deleteUserMessages);
router.delete('/delete-selected', authMiddleware, messageController.deleteSelectedMessages);
router.get('/:userId', authMiddleware, messageController.getConversations);

module.exports = router; 