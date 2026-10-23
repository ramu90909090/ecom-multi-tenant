const SiteSettings = require("../models/SiteSettings");

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    let settings = await SiteSettings.findOne({ tenant: tenantId });
    if (!settings) {
      settings = await SiteSettings.create({
        tenant: tenantId,
        navbar: { brandName: req.tenant.storeName || "KHASTORE" },
        footer: { brandName: req.tenant.storeName || "KHASTORE" }
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    let settings = await SiteSettings.findOne({ tenant: tenantId });
    if (!settings) {
      settings = new SiteSettings({ tenant: tenantId });
    }

    const body = req.body.settingsData ? JSON.parse(req.body.settingsData) : req.body;

    if (req.files) {
      if (req.files.navbarLogo) {
        body.navbar = body.navbar || {};
        body.navbar.logoUrl = `/uploads/products/${req.files.navbarLogo[0].filename}`;
      }
      if (req.files.footerLogo) {
        body.footer = body.footer || {};
        body.footer.logoUrl = `/uploads/products/${req.files.footerLogo[0].filename}`;
      }
      if (req.files.paymentQrFile) {
        body.paymentGateway = body.paymentGateway || {};
        body.paymentGateway.qrImageUrl = `/uploads/products/${req.files.paymentQrFile[0].filename}`;
      }
      if (req.files.faviconFile) {
        body.meta = body.meta || {};
        body.meta.faviconUrl = `/uploads/products/${req.files.faviconFile[0].filename}`;
      }
    }

    Object.assign(settings, body);
    settings.tenant = tenantId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Site settings updated successfully!",
      data: settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};