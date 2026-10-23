const AboutConfig = require("../models/AboutConfig");

const getOrCreateAboutConfig = async (tenantId) => {
  let config = await AboutConfig.findOne({ tenant: tenantId });
  if (!config) {
    config = await AboutConfig.create({
      tenant: tenantId,
      hero: {
        badge: "Redefining Online Shopping Experience",
        headingPrefix: "Humara Maqsad:",
        headingHighlight: "Quality & Bharosa Har Order Par",
        description: "KHASTORE par hum authentic items ko affordably deliver karte hain.",
        isEnabled: true
      },
      stats: [
        { number: 75000, suffix: "+", label: "Delivered Orders", change: "Pan-India Reach" },
        { number: 120, suffix: "+", label: "Genuine Brands", change: "Verified Partners" },
        { number: 4.8, suffix: " ★", isDecimal: true, label: "Customer Rating", change: "Based on 15k+ Reviews" },
        { number: 24, prefix: "< ", suffix: " Hrs", label: "Dispatch Speed", change: "Fastest Fulfilment" }
      ],
      infrastructure: [
        {
          tag: "Flagship Experience Store",
          title: "Physical Retail & Demo Lounge",
          desc: "Walk in, try products hands-on aur direct store pickup support.",
          icon: "Store",
          images: [
            {
              url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
              caption: "Store Front",
              isActive: true
            }
          ]
        }
      ],
      founder: {
        name: "Rahul Sharma",
        designation: "Founder & CEO",
        quote: "Customer ka bharosa kisi bhi marketing campaign se badhkar hai.",
        visionStory: "Humara ek hi principle tha: 100% genuine products at direct fair prices.",
        images: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80", isActive: true }],
        socials: { linkedin: "#", twitter: "#", email: "founder@store.com" },
        isEnabled: true
      },
      pillars: [
        {
          icon: "ShieldCheck",
          title: "100% Genuine Brands",
          color: "from-blue-500 to-cyan-500",
          desc: "Direct OEM tie-ups bina kisi middleman ke."
        }
      ],
      milestones: [
        { year: "2024", title: "Direct-to-Consumer", desc: "10,000+ satisfied customers." },
        { year: "2026", title: "National Footprint", desc: "Pan-India express delivery network." }
      ],
      cta: {
        heading: "Experience the Quality Yourself",
        description: "Latest gadgets aur curated lifestyle items order karein.",
        buttonText: "Start Shopping Now",
        buttonLink: "/products",
        isEnabled: true
      }
    });
  }
  return config;
};

exports.getAboutConfig = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGeneralSections = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    if (req.body.hero) config.hero = { ...config.hero, ...req.body.hero };
    if (req.body.founder) config.founder = { ...config.founder, ...req.body.founder };
    if (req.body.cta) config.cta = { ...config.cta, ...req.body.cta };

    await config.save();
    res.status(200).json({ success: true, message: "General content updated", data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.stats.push(req.body);
    await config.save();
    res.status(201).json({ success: true, message: "Stat added", data: config.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    const stat = config.stats.id(req.params.statId);
    if (!stat) return res.status(404).json({ success: false, message: "Stat not found" });

    Object.assign(stat, req.body);
    await config.save();
    res.status(200).json({ success: true, message: "Stat updated", data: config.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStat = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.stats.pull({ _id: req.params.statId });
    await config.save();
    res.status(200).json({ success: true, message: "Stat deleted", data: config.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.infrastructure.push(req.body);
    await config.save();
    res.status(201).json({ success: true, message: "Infrastructure item added", data: config.infrastructure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    const infra = config.infrastructure.id(req.params.infraId);
    if (!infra) return res.status(404).json({ success: false, message: "Item not found" });

    Object.assign(infra, req.body);
    await config.save();
    res.status(200).json({ success: true, message: "Infrastructure item updated", data: config.infrastructure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteInfraItem = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.infrastructure.pull({ _id: req.params.infraId });
    await config.save();
    res.status(200).json({ success: true, message: "Item deleted", data: config.infrastructure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleInfraImageActive = async (req, res) => {
  try {
    const { infraId, imageIndex } = req.params;
    const config = await getOrCreateAboutConfig(req.tenant._id);
    const infra = config.infrastructure.id(infraId);
    if (!infra || !infra.images[imageIndex]) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    infra.images[imageIndex].isActive = !infra.images[imageIndex].isActive;
    await config.save();
    res.status(200).json({ success: true, message: "Image active status toggled", data: infra });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addPillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.pillars.push(req.body);
    await config.save();
    res.status(201).json({ success: true, message: "Pillar added", data: config.pillars });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    const pillar = config.pillars.id(req.params.pillarId);
    if (!pillar) return res.status(404).json({ success: false, message: "Pillar not found" });

    Object.assign(pillar, req.body);
    await config.save();
    res.status(200).json({ success: true, message: "Pillar updated", data: config.pillars });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePillar = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.pillars.pull({ _id: req.params.pillarId });
    await config.save();
    res.status(200).json({ success: true, message: "Pillar deleted", data: config.pillars });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.milestones.push(req.body);
    await config.save();
    res.status(201).json({ success: true, message: "Milestone added", data: config.milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    const milestone = config.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: "Milestone not found" });

    Object.assign(milestone, req.body);
    await config.save();
    res.status(200).json({ success: true, message: "Milestone updated", data: config.milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const config = await getOrCreateAboutConfig(req.tenant._id);
    config.milestones.pull({ _id: req.params.milestoneId });
    await config.save();
    res.status(200).json({ success: true, message: "Milestone deleted", data: config.milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};