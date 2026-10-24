const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID zaroori hai"],
      index: true
    },
    name: {
      type: String,
      required: [true, "Product name bharna zaroori hai"],
      trim: true
    },
    category: {
      type: String,
      required: [true, "Category zaroori hai"],
      enum: ["Electronics", "Fashion", "Footwear", "Home", "Accessories"],
      default: "Electronics"
    },
    price: {
      type: Number,
      required: [true, "Price zaroori hai"],
      min: [0, "Price negative nahi ho sakta"]
    },
    actualPrice: {
      type: Number,
      default: function () {
        return this.price;
      }
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 95
    },
    finalPrice: {
      type: Number,
      default: function () {
        return this.price;
      }
    },
    stock: {
      type: Number,
      required: [true, "Stock zaroori hai"],
      default: 10,
      min: 0
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    },
    isTrending: {
      type: Boolean,
      default: false
    },
    isRecent: {
      type: Boolean,
      default: true
    },
    // Array of Image String URLs (Kam se kam 1, maximum 5)
    images: {
      type: [String],
      required: [true, "Kam se kam ek product image zaroori hai"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1 && val.length <= 5;
        },
        message: "Product me 1 se lekar 5 images honi chahiye."
      }
    },
    image: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      required: [true, "Description zaroori hai"],
      trim: true
    }
  },
  { timestamps: true }
);

// Auto calculate finalPrice before save
productSchema.pre("save", function () {
  if (this.discount > 0 && this.price) {
    this.finalPrice = Math.round(this.price - (this.price * this.discount) / 100);
  } else {
    this.finalPrice = this.price;
  }
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  }
});

module.exports = mongoose.model("Product", productSchema);