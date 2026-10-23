const Tenant = require("../models/Tenant");
const SiteSettings = require("../models/SiteSettings");
const AboutConfig = require("../models/AboutConfig");
const ContactConfig = require("../models/ContactConfig");
const User = require("../models/User");

// =========================================================================
// 1. ONBOARD / CREATE NEW TENANT STORE
// =========================================================================
exports.createTenant = async (req, res) => {
  try {
    const {
      storeName,
      slug,
      customDomain,
      ownerEmail,
      adminPassword,
      adminName,
      adminMobile
    } = req.body;

    // Basic Input Validations
    if (!storeName || !slug || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: "Store Name, Slug aur Owner Email anivarya hain."
      });
    }

    const cleanSlug = String(slug).trim().toLowerCase();
    const cleanEmail = String(ownerEmail).trim().toLowerCase();

    // Check Slug Duplication
    const existingTenant = await Tenant.findOne({ slug: cleanSlug });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: `Slug '${cleanSlug}' pehle se book hai. Kripya doosra chunein.`
      });
    }

    // Fix for E11000 duplicate key error:
    // Agar custom domain nahi hai to 'undefined' rakhein (taaki MongoDB sparse index ignore kare)
    let cleanCustomDomain = undefined;
    if (customDomain && customDomain.trim()) {
      cleanCustomDomain = customDomain.trim().toLowerCase();
      const domainExists = await Tenant.findOne({ customDomain: cleanCustomDomain });
      if (domainExists) {
        return res.status(400).json({
          success: false,
          message: `Custom Domain '${cleanCustomDomain}' kisi doosre store par mapped hai.`
        });
      }
    }

    // 1. Tenant Document Create karein
    const tenantPayload = {
      storeName: storeName.trim(),
      slug: cleanSlug,
      ownerEmail: cleanEmail,
      isActive: true
    };

    if (cleanCustomDomain) {
      tenantPayload.customDomain = cleanCustomDomain;
    }

    const tenant = await Tenant.create(tenantPayload);

    // 2. Initial Default SiteSettings (Navbar & Footer Branding)
    await SiteSettings.create({
      tenant: tenant._id,
      meta: {
        siteTitle: `${tenant.storeName} - Online Store`,
        faviconUrl: ""
      },
      navbar: {
        brandName: tenant.storeName,
        brandSubtitle: "Exclusive Deals",
        logoUrl: "",
        showSparkleIcon: true
      },
      paymentGateway: {
        upiId: "juhip2019@okaxis",
        merchantName: tenant.storeName,
        qrImageUrl: "",
        verificationNote: "Payment verify karein ki receiver sahi hai.",
        codMinAmount: 5000,
        isCodEnabled: true,
        isUpiEnabled: true
      },
      footer: {
        brandName: tenant.storeName,
        brandSubtitle: "Premium Deals 2026",
        logoUrl: "",
        description: `Direct factory pricing aur authentic deals ka best platform for ${tenant.storeName}.`,
        copyrightText: `© ${new Date().getFullYear()} ${tenant.storeName}. All rights reserved.`
      }
    });

    // 3. Initial Default About Config
    await AboutConfig.create({
      tenant: tenant._id,
      hero: {
        badge: "Redefining Online Shopping Experience",
        headingPrefix: "Welcome to",
        headingHighlight: tenant.storeName,
        description: `${tenant.storeName} par authentic lifestyle items affordably deliver karte hain.`,
        isEnabled: true
      },
      stats: [
        { number: 10000, suffix: "+", label: "Orders Delivered", change: "Fast Delivery" },
        { number: 100, suffix: "+", label: "Genuine Brands", change: "Verified Partners" },
        { number: 4.8, suffix: " ★", isDecimal: true, label: "Customer Rating", change: "Reviews" }
      ],
      founder: {
        name: adminName || "Store Owner",
        designation: "Founder & CEO",
        quote: "Customer ka bharosa kisi bhi campaign se badhkar hai.",
        visionStory: "Humara ek hi principle tha: 100% genuine products at direct fair prices.",
        socials: { email: cleanEmail },
        isEnabled: true
      }
    });

    // 4. Initial Default Contact Config
    await ContactConfig.create({
      tenant: tenant._id,
      banner: {
        tagline: "24/7 Dedicated Support",
        heading: `Contact ${tenant.storeName} Helpdesk`,
        description: "Product inquiry ya order tracking ke liye reach karein.",
        isEnabled: true
      },
      carouselCards: [
        {
          icon: "Phone",
          title: "Direct Calling Desk",
          desc: "Instant live agent support",
          contact: adminMobile ? `+91 ${adminMobile}` : "+91 98765 43210",
          contactSub: "Active Mon - Sat (9:00 AM - 8:00 PM)",
          action: `tel:${adminMobile || "9876543210"}`,
          btnText: "Call Now",
          gradient: "from-blue-500 to-cyan-500"
        },
        {
          icon: "Mail",
          title: "Official Email Support",
          desc: "Ticketing & queries",
          contact: cleanEmail,
          contactSub: "Turnaround: 2 - 4 Hours",
          action: `mailto:${cleanEmail}`,
          btnText: "Send Mail",
          gradient: "from-pink-500 to-rose-500"
        }
      ],
      faqs: [
        {
          question: "Order dispatch hone me kitna time lagta hai?",
          answer: "Hum sabhi orders ko 24 ghante ke andar warehouse se dispatch karte hain."
        },
        {
          question: "Product return kaise karein?",
          answer: "7 dinon ke andar return request place karke free pickup prapt karein."
        }
      ]
    });

    // 5. Create Store Super-Admin User (Agar adminPassword provide kiya gaya ho)
    let adminUser = null;
    if (adminPassword) {
      adminUser = await User.create({
        tenant: tenant._id,
        name: adminName || `${tenant.storeName} Admin`,
        email: cleanEmail,
        mobile: adminMobile || "919876543210",
        password: adminPassword,
        role: "admin",
        isVerified: true,
        address: "Store HQ",
        pincode: "110001",
        state: "Delhi",
        district: "Central"
      });
    }

    res.status(201).json({
      success: true,
      message: `Store '${tenant.storeName}' safaltapoorvak ban gaya!`,
      data: {
        tenant: {
          id: tenant._id,
          storeName: tenant.storeName,
          slug: tenant.slug,
          customDomain: tenant.customDomain || null,
          ownerEmail: tenant.ownerEmail
        },
        adminUser: adminUser
          ? {
              id: adminUser._id,
              name: adminUser.name,
              email: adminUser.email,
              role: adminUser.role
            }
          : null
      }
    });
  } catch (error) {
    console.error("Create Tenant Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 2. GET CURRENT RESOLVED TENANT STORE INFO (Public)
// =========================================================================
exports.getCurrentTenant = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant store ki pehchaan nahi ho saki."
      });
    }

    res.status(200).json({
      success: true,
      tenant: {
        id: req.tenant._id,
        storeName: req.tenant.storeName,
        slug: req.tenant.slug,
        customDomain: req.tenant.customDomain || null,
        ownerEmail: req.tenant.ownerEmail
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 3. UPDATE CUSTOM DOMAIN (Admin Only)
// =========================================================================
exports.updateCustomDomain = async (req, res) => {
  try {
    const { customDomain } = req.body;
    let cleanDomain = undefined;

    if (customDomain && customDomain.trim()) {
      cleanDomain = customDomain.trim().toLowerCase();

      // Check if domain is already in use by another tenant
      const exists = await Tenant.findOne({
        customDomain: cleanDomain,
        _id: { $ne: req.tenant._id }
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: `Domain '${cleanDomain}' pehle se kisi doosre account par registered hai.`
        });
      }
    }

    const updatePayload = cleanDomain ? { customDomain: cleanDomain } : { $unset: { customDomain: 1 } };

    const updated = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      updatePayload,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Custom domain setting successfully update ho gayi!",
      tenant: {
        id: updated._id,
        storeName: updated.storeName,
        slug: updated.slug,
        customDomain: updated.customDomain || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};