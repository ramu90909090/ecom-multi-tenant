const mongoose = require("mongoose");

const emailQueueSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
      default: null
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    htmlBody: {
      type: String,
      required: true
    },
    triggerType: {
      type: String,
      enum: [
        "order_status",
        "payment_status",
        "inquiry_status",
        "order_created",
        "general"
      ],
      default: "general"
    },
    referenceId: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "failed_permanently"],
      default: "pending",
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastError: {
      type: String,
      default: ""
    },
    sentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound index pending emails ko fast fetch karne ke liye
emailQueueSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("EmailQueue", emailQueueSchema);