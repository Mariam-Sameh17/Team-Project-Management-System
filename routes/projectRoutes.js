const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const projectController = require("../controllers/projectController");

router.post("/create", authController.protect, projectController.createProject);

router.patch(
  "/update",
  authController.protect,
  authController.restrictToOwner,
  projectController.updateProject,
);

router.get("/find", authController.protect, projectController.findProjects);

router.get(
  "/findOne",
  authController.protect,
  authController.restrictToOwner,
  projectController.findProject,
);

router.delete(
  "/delete",
  authController.protect,
  authController.restrictToOwner,
  projectController.deleteProject,
);
module.exports = router;
