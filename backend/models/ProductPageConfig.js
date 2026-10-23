const mongoose = require("mongoose");

const productPageConfigSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true
    },
    banner: {
      tagline: { type: String, default: "Exclusive Collection 2026", trim: true },
      title: { type: String, default: "Explore All Products", trim: true },
      description: {
        type: String,
        default:
          "Curated electronics, top-rated fashion wear, footwear aur home utility essentials direct warehouse discount rates par.",
        trim: true
      },
      isEnabled: { type: Boolean, default: true }
    },
    carouselSettings: {
      title: { type: String, default: "Top Trending Picks", trim: true },
      subtitle: { type: String, default: "Hot Sellers This Week", trim: true },
      isEnabled: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductPageConfig", productPageConfigSchema);
