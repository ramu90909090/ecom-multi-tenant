const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  deleteOrder
} = require("../controllers/orderController");

const adminAuth = [authMiddleware, roleMiddleware("admin")];

// 1. Public Order Placement
router.post("/", createOrder);

// 2. Logged-in Customer Specific Orders
router.get("/my-orders", authMiddleware, getMyOrders);

// 3. Admin Orders CRM Endpoints
router.get("/", adminAuth, getAllOrders);
router.put("/:id", adminAuth, updateOrderStatus);
router.delete("/:id", adminAuth, deleteOrder);

module.exports = router;