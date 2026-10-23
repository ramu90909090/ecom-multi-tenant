const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["registration", "login", "forgot_password"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180 // 3 minutes TTL
  }
});

module.exports = mongoose.model("Otp", otpSchema);