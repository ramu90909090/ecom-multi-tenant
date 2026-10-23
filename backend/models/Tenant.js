const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // default: null kadhi nakho ane sparse: true rakho
    customDomain: { 
      type: String, 
      unique: true, 
      sparse: true, 
      lowercase: true, 
      trim: true 
    },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);