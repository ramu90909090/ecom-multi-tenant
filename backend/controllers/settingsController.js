const SiteSettings = require("../models/SiteSettings");

// Helper: Seed initial config if not exists
const getOrCreateSettings = async (tenantId) => {
  let query = tenantId ? { tenant: tenantId } : {};
  let settings = await SiteSettings.findOne(query);

  if (!settings) {
    const createData = {
      navbar: {
        brandName: "KHASTORE",
        brandSubtitle: "Premium Deals 2026",
        logoUrl: ""
      },
      paymentGateway: {
        upiId: "juhip2019@okaxis",
        merchantName: "Juhi Pafhj",
        codMinAmount: 5000,
        verificationNote:
          "Payment karte waqt verify karein ki receiver UPI ID aur name account se match ho raha ho."
      },
      footer: {
        brandName: "KHASTORE",
        brandSubtitle: "Premium Deals 2026",
        description:
          "Direct factory pricing aur authentic lifestyle & electronic gadgets express pan-India delivery ke sath.",
        logoUrl: "",
        trustGuarantees: [
          { title: "Pan-India Shipping", subtitle: "2-4 Business Days Express Delivery", iconKey: "truck" },
          { title: "100% Genuine Brands", subtitle: "Certified Factory Sealed Units", iconKey: "shield" },
          { title: "7 Days Easy Returns", subtitle: "Doorstep Pickup & Instant UPI Refund", iconKey: "rotate" },
          { title: "24/7 Priority Support", subtitle: "Live WhatsApp & Ticket Desk", iconKey: "headphones" }
        ],
        customerDesk: {
          address: "Hazratganj, Lucknow, UP - 226001",
          phone: "+91 81879 21060",
          email: "support@khastore.com"
        },
        socialLinks: {
          instagram: "https://instagram.com",
          twitter: "https://twitter.com",
          youtube: "https://youtube.com"
        },
        quickLinks: [
          { label: "Home", url: "/" },
          { label: "All Products", url: "/products" },
          { label: "About Us", url: "/about" },
          { label: "Contact Us", url: "/contact" }
        ],
        copyrightText: "© 2026 KHASTORE. All rights reserved.",
        heartNotice: "Crafted with passion for authentic products."
      }
    };

    if (tenantId) createData.tenant = tenantId;
    settings = await SiteSettings.create(createData);
  }
  return settings;
};

// 1. GET Settings (Public & Tenant-Scoped)
exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const settings = await getOrCreateSettings(tenantId);
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. UPDATE Settings (Navbar Logo File Upload + Clean Form Data)
exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const settings = await getOrCreateSettings(tenantId);

    let parsedData = {};
    if (req.body.settingsData) {
      try {
        parsedData = JSON.parse(req.body.settingsData);
      } catch {
        parsedData = req.body;
      }
    } else {
      parsedData = req.body;
    }

    // 1. Merge Navbar Settings
    if (parsedData.navbar) {
      settings.navbar.brandName = parsedData.navbar.brandName ?? settings.navbar.brandName;
      settings.navbar.brandSubtitle = parsedData.navbar.brandSubtitle ?? settings.navbar.brandSubtitle;
      if (parsedData.navbar.logoUrl !== undefined) {
        settings.navbar.logoUrl = parsedData.navbar.logoUrl;
      }
    }

    // Handle Navbar Logo File Upload (Higher Priority over text URL)
    if (req.files && req.files.navbarLogo && req.files.navbarLogo[0]) {
      const uploadedFile = req.files.navbarLogo[0];
      // Path format check (uploads folder se match)
      settings.navbar.logoUrl = `/uploads/${uploadedFile.filename}`;
    }

    // 2. Merge Payment Gateway (QR image upload removed)
    if (parsedData.paymentGateway) {
      settings.paymentGateway.upiId = parsedData.paymentGateway.upiId ?? settings.paymentGateway.upiId;
      settings.paymentGateway.merchantName = parsedData.paymentGateway.merchantName ?? settings.paymentGateway.merchantName;
      settings.paymentGateway.codMinAmount = parsedData.paymentGateway.codMinAmount ?? settings.paymentGateway.codMinAmount;
      settings.paymentGateway.verificationNote = parsedData.paymentGateway.verificationNote ?? settings.paymentGateway.verificationNote;
    }

    // 3. Merge Footer Settings (Footer logo file upload removed, text & details retained)
    if (parsedData.footer) {
      settings.footer.brandName = parsedData.footer.brandName ?? settings.footer.brandName;
      settings.footer.brandSubtitle = parsedData.footer.brandSubtitle ?? settings.footer.brandSubtitle;
      settings.footer.description = parsedData.footer.description ?? settings.footer.description;

      if (Array.isArray(parsedData.footer.trustGuarantees)) {
        settings.footer.trustGuarantees = parsedData.footer.trustGuarantees;
      }
      if (parsedData.footer.customerDesk) {
        settings.footer.customerDesk = { ...settings.footer.customerDesk, ...parsedData.footer.customerDesk };
      }
      if (parsedData.footer.socialLinks) {
        settings.footer.socialLinks = { ...settings.footer.socialLinks, ...parsedData.footer.socialLinks };
      }
      if (Array.isArray(parsedData.footer.quickLinks)) {
        settings.footer.quickLinks = parsedData.footer.quickLinks;
      }
      settings.footer.copyrightText = parsedData.footer.copyrightText ?? settings.footer.copyrightText;
      settings.footer.heartNotice = parsedData.footer.heartNotice ?? settings.footer.heartNotice;
    }

    await settings.save();
    return res.status(200).json({
      success: true,
      message: "Settings successfully updated!",
      data: settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};