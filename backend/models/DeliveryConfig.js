const mongoose = require("mongoose");

const deliveryConfigSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null
    },
    category: {
      type: String,
      required: [true, "Category name anivarya hai"],
      trim: true
    },
    shippingFee: {
      type: Number,
      required: [true, "Delivery/Shipping charge anivarya hai"],
      min: [0, "Delivery fee 0 se kam nahi ho sakti"],
      default: 50
    },
    freeDeliveryAbove: {
      type: Number,
      default: 1000,
      min: [0, "Free delivery threshold 0 se kam nahi ho sakta"]
    },
    estimatedDays: {
      type: String,
      default: "2-4 Business Days",
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

deliveryConfigSchema.index({ tenant: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("DeliveryConfig", deliveryConfigSchema);