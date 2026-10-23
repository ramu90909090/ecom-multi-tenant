const mongoose = require("mongoose");

const statItemSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  prefix: { type: String, default: "", trim: true },
  suffix: { type: String, default: "+", trim: true },
  isDecimal: { type: Boolean, default: false },
  label: { type: String, required: true, trim: true },
  change: { type: String, default: "", trim: true }
});

const infraItemSchema = new mongoose.Schema({
  tag: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
  icon: { type: String, default: "Store" },
  images: [
    {
      url: { type: String, required: true, trim: true },
      caption: { type: String, default: "", trim: true },
      isActive: { type: Boolean, default: true }
    }
  ]
});

const pillarSchema = new mongoose.Schema({
  icon: { type: String, default: "ShieldCheck" },
  title: { type: String, required: true, trim: true },
  color: { type: String, default: "from-blue-500 to-cyan-500" },
  desc: { type: String, required: true, trim: true }
});

const milestoneSchema = new mongoose.Schema({
  year: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true }
});

const aboutConfigSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true, index: true },
    hero: {
      badge: { type: String, default: "Redefining Online Shopping Experience" },
      headingPrefix: { type: String, default: "Humara Maqsad:" },
      headingHighlight: { type: String, default: "Quality & Bharosa Har Order Par" },
      description: {
        type: String,
        default: "Yahan par hum tech gadgets, authentic lifestyle wear aur home upgrades ko affordably deliver karte hain."
      },
      isEnabled: { type: Boolean, default: true }
    },
    stats: [statItemSchema],
    infrastructure: [infraItemSchema],
    founder: {
      name: { type: String, default: "Rahul Sharma" },
      designation: { type: String, default: "Founder & CEO" },
      quote: { type: String, default: "Customer ka bharosa kisi bhi marketing campaign se badhkar hai." },
      visionStory: {
        type: String,
        default: "Jab humne yeh platform shuru kiya tha, humara ek hi principle tha: 100% genuine products at direct fair prices."
      },
      images: [
        {
          url: { type: String, required: true },
          isActive: { type: Boolean, default: true }
        }
      ],
      socials: {
        linkedin: { type: String, default: "" },
        twitter: { type: String, default: "" },
        email: { type: String, default: "founder@store.com" }
      },
      isEnabled: { type: Boolean, default: true }
    },
    pillars: [pillarSchema],
    milestones: [milestoneSchema],
    cta: {
      heading: { type: String, default: "Experience the Quality Yourself" },
      description: { type: String, default: "Latest gadgets, curated fashion aur reliable lifestyle items direct warehouse price par order karein." },
      buttonText: { type: String, default: "Start Shopping Now" },
      buttonLink: { type: String, default: "/products" },
      isEnabled: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AboutConfig", aboutConfigSchema);