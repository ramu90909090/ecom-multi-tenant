const mongoose = require("mongoose");

const trustGuaranteeSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  iconKey: { type: String, default: "truck" } // truck, shield, rotate, headphones
});

const quickLinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true }
});

const siteSettingsSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    navbar: {
      brandName: { type: String, default: "STORE" },
      brandSubtitle: { type: String, default: "Verified Deals" },
      logoUrl: { type: String, default: "" }
    },
    paymentGateway: {
      upiId: { type: String, default: "juhip2019@okaxis" },
      merchantName: { type: String, default: "Juhi Pafhj" },
      qrImageUrl: { type: String, default: "" },
      codMinAmount: { type: Number, default: 5000 },
      verificationNote: {
        type: String,
        default:
          "Payment karte waqt verify karein ki receiver UPI ID aur name account se match ho raha ho."
      }
    },
    footer: {
      brandName: { type: String, default: "STORE" },
      brandSubtitle: { type: String, default: "Premium Deals 2026" },
      description: {
        type: String,
        default:
          "Direct factory pricing aur authentic lifestyle & electronic gadgets express pan-India delivery ke sath."
      },
      logoUrl: { type: String, default: "" },
      trustGuarantees: {
        type: [trustGuaranteeSchema],
        default: [
          { title: "Pan-India Shipping", subtitle: "2-4 Business Days Express Delivery", iconKey: "truck" },
          { title: "100% Genuine Brands", subtitle: "Certified Factory Sealed Units", iconKey: "shield" },
          { title: "7 Days Easy Returns", subtitle: "Doorstep Pickup & Instant UPI Refund", iconKey: "rotate" },
          { title: "24/7 Priority Support", subtitle: "Live WhatsApp & Ticket Desk", iconKey: "headphones" }
        ]
      },
      customerDesk: {
        address: { type: String, default: "Hazratganj, Lucknow, UP - 226001" },
        phone: { type: String, default: "+91 81879 21060" },
        email: { type: String, default: "support@khastore.com" }
      },
      socialLinks: {
        instagram: { type: String, default: "" },
        twitter: { type: String, default: "" },
        youtube: { type: String, default: "" }
      },
      quickLinks: {
        type: [quickLinkSchema],
        default: [
          { label: "Home", url: "/" },
          { label: "Products", url: "/products" },
          { label: "About Us", url: "/about" },
          { label: "Contact Desk", url: "/contact" }
        ]
      },
      copyrightText: { type: String, default: "© 2026 All Rights Reserved." },
      heartNotice: { type: String, default: "Crafted with quality for pan-India buyers." }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);