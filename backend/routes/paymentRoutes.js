const express = require("express");
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authmiddleware");
const router = express.Router();

router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;