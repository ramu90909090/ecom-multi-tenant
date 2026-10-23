const mongoose = require("mongoose");

const contactCardSchema = new mongoose.Schema({
  icon: { type: String, default: "Phone" },
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
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
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
        default: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113911.23388796856!2d80.85966601662998!3d26.848622994073356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bfd991f32b16b%3A0x93ccba8909978be7!2sLucknow%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
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