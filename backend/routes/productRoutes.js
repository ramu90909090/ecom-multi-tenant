const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Sirf images upload karne ki permission hai!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Admin Only Routes
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  productController.createProduct
);

router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 5),
  productController.updateProduct
);

router.delete("/:id", authMiddleware, productController.deleteProduct);

module.exports = router;