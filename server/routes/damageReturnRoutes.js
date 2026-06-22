const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth.js");
const { createDamage, getDamages, getDamageCategories, deleteDamage, updateDamage } = require("../controllers/damageReturnController");

router.post("/", authMiddleware, createDamage);
router.get("/categories", authMiddleware, getDamageCategories);
router.get("/", authMiddleware, getDamages);
router.put("/:id", authMiddleware, updateDamage);
router.delete("/:id", authMiddleware, deleteDamage);

module.exports = router;
