const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { productValidationRules, validate } = require("../validators/productValidator");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  quickUpdateStock,
  deleteProduct
} = require("../controllers/productController");

const adminAuth = [authMiddleware, roleMiddleware("admin")];

// 1. Public Storefront Endpoints
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 2. Admin Inventory & Management Endpoints (Max 5 images allowed)
router.post(
  "/",
  adminAuth,
  upload.array("imageFiles", 5),
  productValidationRules,
  validate,
  createProduct
);

router.put(
  "/:id",
  adminAuth,
  upload.array("imageFiles", 5),
  productValidationRules,
  validate,
  updateProduct
);

router.patch("/:id/stock", adminAuth, quickUpdateStock);
router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;