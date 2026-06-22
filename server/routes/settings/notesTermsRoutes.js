const express = require("express");
const router = express.Router();
const {
  getNotesTermsSettings,
  updateNotesTermsSettings,
} = require("../../controllers/settings/notesTermsController");
const { authMiddleware } = require("../../middleware/auth");

// Authentication middleware applied to all routes to set req.db context
router.use(authMiddleware);

router.get("/", getNotesTermsSettings);
router.put("/", updateNotesTermsSettings);

module.exports = router;
