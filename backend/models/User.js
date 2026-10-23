const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    tenant: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Tenant", 
      required: true, 
      index: true 
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user"
    },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Email is unique per tenant
userSchema.index({ tenant: 1, email: 1 }, { unique: true });

// Clean Async Hook: No next argument (Mongoose 7/8/9 compatible)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);