const ProductPageConfig = require("../models/ProductPageConfig");

const getOrCreateConfig = async (tenantId, storeName = "Our Store") => {
  let config = await ProductPageConfig.findOne({ tenant: tenantId });
  if (!config) {
    config = await ProductPageConfig.create({
      tenant: tenantId,
      banner: {
        tagline: "Exclusive Collection 2026",
        title: `Explore All Products - ${storeName}`,
        description:
          "Curated electronics, top-rated fashion wear, footwear aur home utility essentials direct warehouse discount rates par.",
        isEnabled: true
      },
      carouselSettings: {
        title: "Top Trending Picks",
        subtitle: "Hot Sellers This Week",
        isEnabled: true
      }
    });
  }
  return config;
};

// 1. Get Product Page Content (Public)
exports.getPageConfig = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const storeName = req.tenant.storeName || "Store";
    const config = await getOrCreateConfig(tenantId, storeName);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update Product Page Content (Admin)
exports.updatePageConfig = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const config = await getOrCreateConfig(tenantId, req.tenant.storeName);

    if (req.body.banner) {
      config.banner = { ...config.banner, ...req.body.banner };
    }
    if (req.body.carouselSettings) {
      config.carouselSettings = { ...config.carouselSettings, ...req.body.carouselSettings };
    }

    await config.save();
    res.status(200).json({
      success: true,
      message: "Product Page CMS settings update ho gayi!",
      data: config
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};