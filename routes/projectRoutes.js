const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const projectController = require("../controllers/projectController");
const taskRoutes = require("./taskRoutes");

router.post("/create", authController.protect, projectController.createProject);

router.patch(
  "/update/:id",
  authController.protect,
  authController.ownerRestriction,
  projectController.updateProject,
);

router.get("/find", authController.protect, projectController.findProjects);

router.get(
  "/findOne/:id",
  authController.protect,
  authController.memberRestriction,
  projectController.findProject,
);

router.delete(
  "/delete/:id",
  authController.protect,
  authController.ownerRestriction,
  projectController.deleteProject,
);
router.patch(
  "/:id/addMember",
  authController.protect,
  authController.ownerRestriction,
  projectController.addMember,
);
router.patch(
  "/:id/removeMember",
  authController.protect,
  authController.ownerRestriction,
  projectController.removeMember,
);
router.use("/:projectId/tasks", taskRoutes);
module.exports = router;
