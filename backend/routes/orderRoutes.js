const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
  bulkDeleteOrders
} = require("../controllers/orderController");

// Admin Security Middleware Array
const adminAuth = [authMiddleware, roleMiddleware("admin")];

// ==========================================
// 1. PUBLIC ORDER PLACEMENT
// ==========================================
router.post("/", createOrder);

// ==========================================
// 2. LOGGED-IN CUSTOMER ORDERS
// ==========================================
router.get("/my-orders", authMiddleware, getMyOrders);

// ==========================================
// 3. ADMIN ORDERS CRM (Role Protected)
// ==========================================
// A. Get All Orders with Search, Filters & Pagination (10, 25, 50, 100)
router.get("/", adminAuth, getAllOrders);

// B. Bulk Delete (Must be declared BEFORE /:id route)
router.delete("/bulk-delete", adminAuth, bulkDeleteOrders);

// C. Update Order Delivery & Payment Status
router.put("/:id", adminAuth, updateOrderStatus);

// D. Delete Single Order
router.delete("/:id", adminAuth, deleteOrder);

module.exports = router;