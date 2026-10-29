const mongoose = require("mongoose");

const gstConfigSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null
    },
    category: {
      type: String,
      required: [true, "Category name zaroori hai"],
      trim: true
    },
    gstRate: {
      type: Number,
      required: [true, "GST rate (%) anivarya hai"],
      min: [0, "GST rate 0 se kam nahi ho sakta"],
      max: [40, "GST rate 40% se zyada nahi ho sakta"],
      default: 18
    },
    hsnCode: {
      type: String,
      trim: true,
      default: ""
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

// Har tenant me category unique honi chahiye
gstConfigSchema.index({ tenant: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("GstConfig", gstConfigSchema);