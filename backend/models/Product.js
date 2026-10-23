const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: [true, "Product name is required"], trim: true },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Electronics", "Fashion", "Footwear", "Home", "Accessories"],
      default: "Electronics"
    },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    discount: { type: Number, default: 0, min: 0, max: 90 },
    stock: { type: Number, required: [true, "Stock quantity is required"], default: 10, min: 0 },
    rating: { type: Number, default: 4.0, min: 1, max: 5 },
    isTrending: { type: Boolean, default: false },
    isRecent: { type: Boolean, default: true },
    images: {
      type: [String],
      required: [true, "Product images are required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 3 && val.length <= 5;
        },
        message: "A product must have at least 3 images and at most 5 images."
      }
    },
    description: { type: String, required: [true, "Description is required"], trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);