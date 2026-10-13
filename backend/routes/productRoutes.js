const express = require("express");
const { protect } = require("../middleware/authmiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct } = require("../controllers/productController");
const upload = require("../config/upload");

const router = express.Router();

// product
router.route("/").get(getProducts).post(protect, admin, upload.single("image"), createProduct);
// each product
router.route("/:id").get(getProductById).put(protect, admin, upload.single("image"), updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;