const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.get("/logout", authController.protect, authController.logout);

router.get("/profile", authController.protect, userController.profile);

router.get("/find", authController.protect, userController.findUsers);

module.exports = router;
