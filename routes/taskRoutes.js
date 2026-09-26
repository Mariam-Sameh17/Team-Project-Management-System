const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const taskController = require("../controllers/taskController");

router.post(
  "/create",
  authController.protect,
  authController.ownerRestriction,
  taskController.createTask,
);

router.patch(
  "/update",
  authController.protect,
  authController.ownerRestriction,
  taskController.updateTask,
);

router.get(
  "/find",
  authController.protect,
  authController.ownerRestriction,
  taskController.findTasks,
);
router.get(
  "/findOne/:title",
  authController.protect,
  authController.ownerRestriction,
  taskController.findTask,
);

router.delete(
  "/delete",
  authController.protect,
  authController.ownerRestriction,
  taskController.deleteTask,
);
router.patch(
  "/assignTask",
  authController.protect,
  authController.ownerRestriction,
  taskController.assignTask,
);
router.patch(
  "/unassignTask",
  authController.protect,
  authController.ownerRestriction,
  taskController.unassignTask,
);
module.exports = router;
