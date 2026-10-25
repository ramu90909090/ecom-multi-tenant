const AboutConfig = require("../models/AboutConfig");

// Helper: Tenant scoped configuration resolver / Auto-seed
const getOrCreateAboutConfig = async (tenantId) => {
  let config = await AboutConfig.findOne({ tenant: tenantId });
  if (!config) {
    config = await AboutConfig.create({
      tenant: tenantId,
      hero: {
        badge: "Redefining Online Shopping Experience",
        headingPrefix: "Humara Maqsad:",
        headingHighlight: "Quality & Bharosa Har Order Par",
        description:
          "Hum tech gadgets, authentic lifestyle wear aur home essentials direct warehouse discount rates par deliver karte hain.",
        isEnabled: true
      },
      stats: [
        { number: 75000, suffix: "+", label: "Delivered Orders", change: "Pan-India Reach" },
        { number: 120, suffix: "+", label: "Curated Brands", change: "Direct OEM Partners" },
        { number: 4.8, suffix: "★", isDecimal: true, label: "Customer Rating", change: "Verified Reviews" },
        { number: 24, suffix: " Hrs", label: "Dispatch Turnaround", change: "Express Logistics" }
      ],
      infrastructure: [
        {
          tag: "Flagship Hub",
          title: "Experience Center",
          desc: "Live testing and customer touchpoint center.",
          icon: "Store",
          images: [
            {
              url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
              caption: "Storefront View",
              isActive: true
            }
          ]
        },
        {
          tag: "Automated Logistics",
          title: "Central Fulfilment Center",
          desc: "Automated sorting and high-speed packaging.",
          icon: "Boxes",
          images: [
            {
              url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
              caption: "Warehouse View",
              isActive: true
            }
          ]
        }
      ],
      founder: {
        name: "Store Founder",
        designation: "Founder & CEO",
        quote: "Customer ka bharosa kisi bhi marketing campaign se badhkar hai.",
        visionStory: "Hum middleman margins ko eliminate karke seedha benefit consumers tak pahunchate hain.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
            isActive: true
          }
        ],
        socials: { linkedin: "", twitter: "", email: "founder@store.com" },
        isEnabled: true
      },
      pillars: [
        {
          icon: "ShieldCheck",
          title: "100% Genuine Guarantee",
          color: "from-blue-500 to-cyan-500",
          desc: "Brand warranty aur invoice ke sath authentic stock."
        },
        {
          icon: "Truck",
          title: "Express Dispatch",
          color: "from-emerald-500 to-teal-500",
          desc: "24 se 48 ghante ke andar secure tracking dispatch."
        },
        {
          icon: "Award",
          title: "Rigorous 4-Step QC",
          color: "from-amber-500 to-orange-500",
          desc: "Har product dispatch se pehle physical checks se guzarta hai."
        },
        {
          icon: "HeartHandshake",
          title: "Customer-First Support",
          color: "from-violet-500 to-indigo-500",
          desc: "Hassle-free 7-day replacements aur quick support resolution."
        }
      ],
      milestones: [
        { year: "2024", title: "The Inception", desc: "Curated catalog ke sath operational journey shuru hui." },
        { year: "2025", title: "Direct Fulfilment", desc: "Automated warehouse & express shipping network ready kiya." },
        { year: "2026", title: "Scale & Trust", desc: "Pan-India reach aur dedicated 24/7 priority support desk." }
      ],
      cta: {
        heading: "Experience the Quality Yourself",
        description: "Latest gadgets, curated fashion aur reliable lifestyle items direct warehouse price par order karein.",
        buttonText: "Start Shopping Now",
        buttonLink: "/products",
        isEnabled: true
      }
    });
  }
  return config;
};

// 1. GET Configuration (Public & Admin)
exports.getAboutConfig = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const config = await getOrCreateAboutConfig(tenantId);
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. UPDATE General Sections (Hero, Founder, CTA)
exports.updateGeneralSections = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const config = await getOrCreateAboutConfig(tenantId);

    if (req.body.hero) config.hero = { ...config.hero, ...req.body.hero };
    if (req.body.founder) config.founder = { ...config.founder, ...req.body.founder };
    if (req.body.cta) config.cta = { ...config.cta, ...req.body.cta };

    await config.save();
    return res.status(200).json({
      success: true,
      message: "General content updated successfully!",
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. STATS CRUD
exports.addStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.stats.push(req.body);
    await config.save();
    return res.status(201).json({ success: true, message: "Stat added", data: config.stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    const stat = config.stats.id(req.params.statId);
    if (!stat) return res.status(404).json({ success: false, message: "Stat not found" });

    Object.assign(stat, req.body);
    await config.save();
    return res.status(200).json({ success: true, message: "Stat updated", data: config.stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.stats.pull({ _id: req.params.statId });
    await config.save();
    return res.status(200).json({ success: true, message: "Stat deleted", data: config.stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. INFRASTRUCTURE & MULTI-IMAGE MANAGEMENT
exports.addInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.infrastructure.push(req.body);
    await config.save();
    return res.status(201).json({ success: true, message: "Infrastructure item added", data: config.infrastructure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    const infra = config.infrastructure.id(req.params.infraId);
    if (!infra) return res.status(404).json({ success: false, message: "Item not found" });

    Object.assign(infra, req.body);
    await config.save();
    return res.status(200).json({ success: true, message: "Infrastructure item updated", data: config.infrastructure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.infrastructure.pull({ _id: req.params.infraId });
    await config.save();
    return res.status(200).json({ success: true, message: "Item deleted", data: config.infrastructure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle active image inside Infrastructure card
exports.toggleInfraImageActive = async (req, res) => {
  try {
    const { infraId, imageIndex } = req.params;
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    const infra = config.infrastructure.id(infraId);
    if (!infra || !infra.images[imageIndex]) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    infra.images[imageIndex].isActive = !infra.images[imageIndex].isActive;
    await config.save();
    return res.status(200).json({
      success: true,
      message: `Image marked as ${infra.images[imageIndex].isActive ? "Active" : "Hidden"}`,
      data: infra.images
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. PILLARS CRUD
exports.addPillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.pillars.push(req.body);
    await config.save();
    return res.status(201).json({ success: true, message: "Pillar added", data: config.pillars });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    const pillar = config.pillars.id(req.params.pillarId);
    if (!pillar) return res.status(404).json({ success: false, message: "Pillar not found" });

    Object.assign(pillar, req.body);
    await config.save();
    return res.status(200).json({ success: true, message: "Pillar updated", data: config.pillars });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.pillars.pull({ _id: req.params.pillarId });
    await config.save();
    return res.status(200).json({ success: true, message: "Pillar deleted", data: config.pillars });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. MILESTONES CRUD
exports.addMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.milestones.push(req.body);
    await config.save();
    return res.status(201).json({ success: true, message: "Milestone added", data: config.milestones });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    const milestone = config.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: "Milestone not found" });

    Object.assign(milestone, req.body);
    await config.save();
    return res.status(200).json({ success: true, message: "Milestone updated", data: config.milestones });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant?._id);
    config.milestones.pull({ _id: req.params.milestoneId });
    await config.save();
    return res.status(200).json({ success: true, message: "Milestone deleted", data: config.milestones });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};