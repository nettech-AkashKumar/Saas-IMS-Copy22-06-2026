const express = require("express");
const router = express.Router();

const assignTargetController = require("../controllers/assignTargetControllers");

const { authMiddleware } = require("../middleware/auth");

router.get(
    "/get",
    authMiddleware,
    assignTargetController.getAssignTarget
);

router.post(
    "/add",
    authMiddleware,
    assignTargetController.addAssignTarget
);

router.put(
  "/update/:id",
  authMiddleware,
  assignTargetController.updateAssignTarget
);

router.delete(
    "/delete/:id",
    authMiddleware,
    assignTargetController.deleteAssignTarget
);

module.exports = router;