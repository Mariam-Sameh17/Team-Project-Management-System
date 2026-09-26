const express = require("express");

const router = express.Router({ mergeParams: true });

const authController = require("../controllers/authController");
const taskController = require("../controllers/taskController");

router.post(
  "/create",
  authController.protect,
  authController.ownerRestriction,
  taskController.createTask,
);

router.patch(
  "/update/:taskId",
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
  "/findOne/:taskId",
  authController.protect,
  authController.ownerRestriction,
  taskController.findTask,
);

router.delete(
  "/delete/:taskId",
  authController.protect,
  authController.ownerRestriction,
  taskController.deleteTask,
);
router.patch(
  "/assign/:taskId",
  authController.protect,
  authController.ownerRestriction,
  taskController.assignTask,
);
router.patch(
  "/unassign/:taskId",
  authController.protect,
  authController.ownerRestriction,
  taskController.unassignTask,
);
module.exports = router;
