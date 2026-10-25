const SiteSettings = require("../models/SiteSettings");
const { testConnection, sendMail } = require("../services/mailService");

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
        verificationNote: "Payment karte waqt verify karein ki receiver UPI ID aur name account se match ho raha ho."
      },
      mailConfig: {
        activeProvider: process.env.DEFAULT_MAIL_PROVIDER || "mailcow",
        gmail: {
          user: process.env.EMAIL_USER || "",
          pass: process.env.EMAIL_PASS || "",
          fromName: "KHASTORE Support"
        },
        mailcow: {
          host: process.env.MAILCOW_HOST || "mail.uprcart.com",
          port: Number(process.env.MAILCOW_PORT) || 587,
          secure: false,
          user: process.env.MAILCOW_USER || "support@uprcart.com",
          pass: process.env.MAILCOW_PASS || "",
          fromEmail: process.env.MAILCOW_USER || "support@uprcart.com",
          fromName: "UPRCART Mailer"
        }
      },
      footer: {
        brandName: "KHASTORE",
        brandSubtitle: "Premium Deals 2026",
        description: "Direct factory pricing aur authentic lifestyle & electronic gadgets express pan-India delivery ke sath."
      }
    };

    if (tenantId) createData.tenant = tenantId;
    settings = await SiteSettings.create(createData);
  }
  return settings;
};

// 1. GET Settings
exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const settings = await getOrCreateSettings(tenantId);
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. UPDATE Settings
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

    // 1. Navbar
    if (parsedData.navbar) {
      settings.navbar.brandName = parsedData.navbar.brandName ?? settings.navbar.brandName;
      settings.navbar.brandSubtitle = parsedData.navbar.brandSubtitle ?? settings.navbar.brandSubtitle;
      if (parsedData.navbar.logoUrl !== undefined) {
        settings.navbar.logoUrl = parsedData.navbar.logoUrl;
      }
    }

    // Logo Upload
    if (req.files && req.files.navbarLogo && req.files.navbarLogo[0]) {
      settings.navbar.logoUrl = `/uploads/${req.files.navbarLogo[0].filename}`;
    }

    // 2. Payment Gateway
    if (parsedData.paymentGateway) {
      settings.paymentGateway.upiId = parsedData.paymentGateway.upiId ?? settings.paymentGateway.upiId;
      settings.paymentGateway.merchantName = parsedData.paymentGateway.merchantName ?? settings.paymentGateway.merchantName;
      settings.paymentGateway.codMinAmount = parsedData.paymentGateway.codMinAmount ?? settings.paymentGateway.codMinAmount;
      settings.paymentGateway.verificationNote = parsedData.paymentGateway.verificationNote ?? settings.paymentGateway.verificationNote;
    }

    // 3. 🔥 Mail Server Config (Gmail / Mailcow)
    if (parsedData.mailConfig) {
      settings.mailConfig = {
        ...settings.mailConfig,
        ...parsedData.mailConfig
      };
    }

    // 4. Footer
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

// 3. TEST SMTP MAIL CONFIGURATION (Live Check & Test Mail)
exports.testMailConfig = async (req, res) => {
  try {
    const { config, targetEmail } = req.body;
    if (!config) {
      return res.status(400).json({ success: false, message: "Configuration missing." });
    }

    // 1. Verify Credentials with SMTP Handshake
    await testConnection(config);

    // 2. If targetEmail is provided, send real test email
    if (targetEmail) {
      await sendMail({
        tenantId: req.tenant?._id,
        to: targetEmail,
        subject: `🧪 Test Email from ${config.activeProvider.toUpperCase()} (${config.mailcow?.host || "Gmail"})`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Mailing Server Verified! 🎉</h2>
            <p>Aapka mailing provider <b>${config.activeProvider.toUpperCase()}</b> safaltapoorvak connect ho gaya hai.</p>
            <p><b>Server:</b> ${config.activeProvider === "mailcow" ? config.mailcow.host : "smtp.gmail.com"}</p>
            <p><b>Timestamp:</b> ${new Date().toLocaleString()}</p>
          </div>
        `
      });
    }

    return res.status(200).json({
      success: true,
      message: `Connection successful! ${targetEmail ? `Test mail sent to ${targetEmail}` : ""}`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `SMTP Verification Failed: ${error.message}`
    });
  }
};