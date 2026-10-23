const ContactConfig = require("../models/ContactConfig");
const SiteSettings = require("../models/SiteSettings");

const getAdminWhatsappPhone = async (tenantId) => {
  try {
    if (tenantId) {
      const contactData = await ContactConfig.findOne({ tenant: tenantId });
      if (contactData && Array.isArray(contactData.carouselCards)) {
        const waCard = contactData.carouselCards.find(
          (c) =>
            c.title?.toLowerCase().includes("whatsapp") ||
            c.icon?.toLowerCase() === "messagecircle" ||
            c.action?.includes("wa.me")
        );
        if (waCard) {
          if (waCard.action && waCard.action.includes("wa.me/")) {
            const matched = waCard.action.match(/wa\.me\/(\d+)/);
            if (matched && matched[1]) return matched[1];
          }
          if (waCard.contact) {
            const cleaned = waCard.contact.replace(/\D/g, "");
            if (cleaned.length >= 10) return cleaned.length === 10 ? `91${cleaned}` : cleaned;
          }
        }
      }

      const siteData = await SiteSettings.findOne({ tenant: tenantId });
      if (siteData?.footer?.customerDesk?.phone) {
        const cleaned = siteData.footer.customerDesk.phone.replace(/\D/g, "");
        if (cleaned.length >= 10) return cleaned.length === 10 ? `91${cleaned}` : cleaned;
      }
    }

    return process.env.ADMIN_WHATSAPP_PHONE || "918187921060";
  } catch (err) {
    console.error("Error fetching dynamic admin WhatsApp phone:", err);
    return process.env.ADMIN_WHATSAPP_PHONE || "918187921060";
  }
};

module.exports = getAdminWhatsappPhone;