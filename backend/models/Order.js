const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: [orderItemSchema],
    shippingDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      state: { type: String, required: true }
    },
    paymentInfo: {
      mode: { type: String, enum: ["upi", "cod"], required: true },
      utrNumber: { type: String, default: "N/A" },
      status: {
        type: String,
        enum: ["Not Verified", "Processing", "Verified", "Rejected", "Cancelled"],
        default: "Processing"
      }
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    pricing: {
      subtotal: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      totalPayable: { type: Number, required: true }
    },
    stockDeducted: { type: Boolean, default: false },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);