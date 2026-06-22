const express = require("express");
const router = express.Router();
const {
  addSubcategory,
  getAllSubcategories,
  deleteSubcategory,
  updateSubcategory,
  getSubcategoriesByCategory,
  getDeletedSubcategories,
  restoreSubcategory,
} = require("../controllers/subCategoryController");

const { verifyToken } = require("../middleware/Authentication/verifyToken");
const { authMiddleware } = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission/checkPermission");

router.post("/categories/:categoryId/subcategories",verifyToken,checkPermission("Subcategory", "write"),authMiddleware,addSubcategory);

router.get("/",verifyToken,checkPermission("Subcategory", "read"),authMiddleware,getAllSubcategories);

router.get("/deleted", authMiddleware, getDeletedSubcategories);

router.patch("/restore/:id", authMiddleware, restoreSubcategory);

router.put("/:id",verifyToken,checkPermission("Subcategory", "update"),authMiddleware,updateSubcategory);

router.delete("/:id",verifyToken,checkPermission("Subcategory", "delete"),authMiddleware,deleteSubcategory);

router.get("/by-category/:categoryId",authMiddleware,getSubcategoriesByCategory);

module.exports = router;
