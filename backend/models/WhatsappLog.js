const mongoose = require("mongoose");

const whatsappLogSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    orderId: { type: String, required: true, index: true },
    recipientNumber: { type: String, required: true, index: true },
    recipientType: { type: String, enum: ["customer", "admin"], default: "customer" },
    triggerType: { type: String, enum: ["order_placed", "status_updated", "payment_verified"], required: true },
    messageBody: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Sent", "Failed", "Not Reachable"], default: "Pending", index: true },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    errorReason: { type: String, default: "" },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsappLog", whatsappLogSchema);