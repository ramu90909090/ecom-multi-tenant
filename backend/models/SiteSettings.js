const mongoose = require("mongoose");

// Sub-schema for Trust Guarantees
const trustGuaranteeSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    iconKey: { type: String, default: "truck" }
  },
  { _id: false }
);

// Sub-schema for Quick Links
const quickLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    url: { type: String, default: "/" }
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true
    },
    navbar: {
      brandName: { type: String, default: "KHASTORE" },
      brandSubtitle: { type: String, default: "Premium Deals" },
      logoUrl: { type: String, default: "" }
    },
    paymentGateway: {
      upiId: { type: String, default: "juhip2019@okaxis" },
      merchantName: { type: String, default: "Juhi Pafhj" },
      codMinAmount: { type: Number, default: 5000 },
      verificationNote: {
        type: String,
        default:
          "Payment karte waqt verify karein ki receiver UPI ID aur name account se match ho raha ho."
      }
    },
    // 🔥 Dynamic Mailing Server Config (Gmail vs Mailcow)
    mailConfig: {
      activeProvider: {
        type: String,
        enum: ["gmail", "mailcow"],
        default: process.env.DEFAULT_MAIL_PROVIDER || "mailcow"
      },
      gmail: {
        user: { type: String, default: process.env.EMAIL_USER || "" },
        pass: { type: String, default: process.env.EMAIL_PASS || "" },
        fromName: { type: String, default: "Store Support" }
      },
      mailcow: {
        host: { type: String, default: process.env.MAILCOW_HOST || "mail.uprcart.com" },
        port: { type: Number, default: Number(process.env.MAILCOW_PORT) || 587 },
        secure: { type: Boolean, default: false },
        user: { type: String, default: process.env.MAILCOW_USER || "support@uprcart.com" },
        pass: { type: String, default: process.env.MAILCOW_PASS || "" },
        fromEmail: { type: String, default: process.env.MAILCOW_USER || "support@uprcart.com" },
        fromName: { type: String, default: "UPRCART Mailer" }
      }
    },
    footer: {
      brandName: { type: String, default: "KHASTORE" },
      brandSubtitle: { type: String, default: "Premium Deals 2026" },
      description: {
        type: String,
        default:
          "Direct factory pricing aur authentic lifestyle & electronic gadgets express pan-India delivery ke sath."
      },
      // ✅ Correct Schema definition with proper defaults
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
        instagram: { type: String, default: "https://instagram.com" },
        twitter: { type: String, default: "https://twitter.com" },
        youtube: { type: String, default: "https://youtube.com" }
      },
      quickLinks: {
        type: [quickLinkSchema],
        default: [
          { label: "Home", url: "/" },
          { label: "All Products", url: "/products" },
          { label: "About Us", url: "/about" },
          { label: "Contact Us", url: "/contact" }
        ]
      },
      copyrightText: { type: String, default: "© 2026 KHASTORE. All rights reserved." },
      heartNotice: { type: String, default: "Crafted with passion for authentic products." }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);