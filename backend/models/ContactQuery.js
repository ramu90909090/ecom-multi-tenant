const mongoose = require("mongoose");

const contactQuerySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending"
    },
    adminNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactQuery", contactQuerySchema);