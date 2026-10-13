const express = require("express");
const router = express.Router();
const { registerUser, loginUser, verifyEmail, resendVerification, getUsers } = require("../controllers/authController");
const { protect } = require("../middleware/authmiddleware");
const { admin } = require("../middleware/adminMiddleware");



router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", loginUser);
router.get("/users", protect, admin, getUsers);


module.exports = router;