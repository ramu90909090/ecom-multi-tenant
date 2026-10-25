const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage"
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1
    },
    maxDiscountAmount: {
      type: Number,
      default: 0 // 0 means no cap for percentage
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    applicableCategory: {
      type: String,
      default: "All", // "All", "Electronics", "Fashion", "Footwear", "Home", etc.
      trim: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    usageLimit: {
      type: Number,
      default: 0 // 0 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

// Unique compound index per tenant (ek tenant me ek code duplicate na ho)
couponSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Coupon", couponSchema);