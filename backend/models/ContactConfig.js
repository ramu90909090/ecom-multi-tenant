const mongoose = require("mongoose");

const contactCardSchema = new mongoose.Schema({
  icon: { type: String, default: "Phone" }, // Phone, MessageCircle, Mail, MapPin, Building2, Headphones
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  contactSub: { type: String, default: "", trim: true },
  action: { type: String, default: "", trim: true },
  btnText: { type: String, default: "Contact", trim: true },
  gradient: { type: String, default: "from-blue-500 to-cyan-500" }
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 }
});

const contactConfigSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    banner: {
      tagline: { type: String, default: "24/7 Dedicated Support Channels" },
      heading: { type: String, default: "Humse Baat Karein, Hum Hamesha Aapke Sath Hain." },
      description: {
        type: String,
        default: "Product inquiry, order tracking, returns ya feedback ke liye niche diye channels se hume reach karein."
      },
      isEnabled: { type: Boolean, default: true }
    },
    carouselCards: [contactCardSchema],
    mapConfig: {
      locationTitle: { type: String, default: "Experience Center Location" },
      embedUrl: {
        type: String,
        default: "https://maps.google.com/maps?q=Lucknow&t=&z=13&ie=UTF8&iwloc=&output=embed"
      },
      visitingHours: { type: String, default: "Visiting Hours: 10:00 AM - 7:00 PM (Monday to Saturday)" },
      isEnabled: { type: Boolean, default: true }
    },
    formConfig: {
      badgeText: { type: String, default: "Quick Ticket" },
      heading: { type: String, default: "Send Us a Direct Message" },
      statusBadge: { type: String, default: "Agents Online" },
      inquiryOptions: {
        type: [String],
        default: [
          "Order Status & Tracking",
          "Return & Refund Request",
          "Product Information",
          "Business Partnership"
        ]
      }
    },
    faqs: [faqSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactConfig", contactConfigSchema);