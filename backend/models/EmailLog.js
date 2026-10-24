const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true
    },
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    triggerType: {
      type: String,
      enum: ["order_status", "payment_status", "inquiry_status", "otp", "general"],
      default: "general"
    },
    referenceId: { type: String, default: "" }, // Order ID ya Ticket ID
    status: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Pending",
      index: true
    },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    errorReason: { type: String, default: "" },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailLog", emailLogSchema);