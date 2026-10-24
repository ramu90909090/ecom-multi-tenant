const ContactQuery = require("../models/ContactQuery");
const SiteSettings = require("../models/SiteSettings");
const { queueMessage } = require("../services/queueService");
const { queueEmail } = require("../services/emailQueueService");

// Helper: Clean Indian Mobile Number (Removes spaces, +91, dashes)
const cleanPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned.length === 10 ? cleaned : null;
};

// Helper: Simple Email Validator
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// WhatsApp Template for Support Inquiries
const getInquiryWhatsAppText = ({ storeName, query, newStatus, adminNotes }) => {
  let statusEmoji = "🎫";
  if (newStatus === "Resolved") statusEmoji = "✅";
  else if (newStatus === "In Progress") statusEmoji = "⚙️";
  else if (newStatus === "Closed") statusEmoji = "📁";

  return (
    `${statusEmoji} *SUPPORT TICKET UPDATE - ${storeName.toUpperCase()}*\n\n` +
    `Namaste *${query.name || "Customer"}*ji,\n\n` +
    `Aapke inquiry ticket (*${query.subject || "General Inquiry"}*) ka status update hua hai:\n` +
    `📍 *Status:* *${newStatus.toUpperCase()}*\n` +
    (adminNotes ? `💬 *Support Note:* ${adminNotes}\n` : "") +
    (query.message ? `\n📝 *Aapki Query:* "${query.message.slice(0, 80)}..."\n` : "") +
    `\nKisi bhi anya sahayata ke liye hamare customer care se sampark karein.\n` +
    `Team *${storeName}*`
  );
};

// HTML Email Template for Support Inquiries
const getInquiryEmailHtml = ({ storeName, query, newStatus, adminNotes }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
      <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">${storeName}</h2>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Customer Support Desk</p>
    </div>
    <div style="padding: 24px 0;">
      <p style="font-size: 15px; color: #1e293b;">Namaste <b>${query.name || "Customer"}</b>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Aapke dwara bheji gayi inquiry ka status update kiya gaya hai:
      </p>
      <div style="background-color: #f8fafc; border-radius: 14px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Ticket Subject: ${query.subject || "Customer Inquiry"}</p>
        <p style="margin: 0; font-size: 20px; font-weight: 900; color: ${newStatus === "Resolved" ? "#16a34a" : "#4f46e5"};">${newStatus}</p>
        ${adminNotes ? `<p style="margin: 12px 0 0; font-size: 13px; color: #1e293b; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;"><b>Response / Memo:</b> ${adminNotes}</p>` : ""}
      </div>
      ${query.message ? `<p style="font-size: 12px; color: #94a3b8; font-style: italic;">Original Message: "${query.message}"</p>` : ""}
    </div>
    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Thank you for contacting <b>${storeName} Support</b>!</p>
    </div>
  </div>
`;

// =========================================================================
// 1. SUBMIT PUBLIC TICKET QUERY
// =========================================================================
exports.submitQuery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const query = await ContactQuery.create({
      tenant: tenantId,
      ...req.body
    });
    return res.status(201).json({
      success: true,
      message: "Ticket created successfully. Our team will contact you shortly.",
      data: query
    });
  } catch (error) {
    console.error("submitQuery Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 2. GET ALL QUERIES (With Search & Pagination)
// =========================================================================
exports.getAllQueries = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    let filter = tenantId ? { tenant: tenantId } : {};

    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt-desc"
    } = req.query;

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
        { message: regex }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const [queries, totalQueries, pendingCount, inProgressCount, resolvedCount] =
      await Promise.all([
        ContactQuery.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(perPage),
        ContactQuery.countDocuments(filter),
        ContactQuery.countDocuments({ ...filter, status: "Pending" }),
        ContactQuery.countDocuments({ ...filter, status: "In Progress" }),
        ContactQuery.countDocuments({ ...filter, status: { $in: ["Resolved", "Closed"] } })
      ]);

    const totalPages = Math.ceil(totalQueries / perPage) || 1;

    return res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
      pagination: {
        total: totalQueries,
        page: currentPage,
        limit: perPage,
        totalPages
      },
      stats: {
        total: totalQueries,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error("getAllQueries Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 3. UPDATE QUERY STATUS (WITH CRASH-PROOF WHATSAPP & EMAIL SAFEGUARDS)
// =========================================================================
exports.updateQueryStatus = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { status, adminNotes } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === "Resolved" || status === "Closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const queryFilter = { _id: req.params.id };
    if (tenantId) queryFilter.tenant = tenantId;

    const query = await ContactQuery.findOneAndUpdate(queryFilter, updateData, { new: true });
    if (!query) return res.status(404).json({ success: false, message: "Ticket nahi mila." });

    // Store Name lookup with safe fallback
    let storeName = req.tenant?.storeName || "KHASTORE";
    try {
      const settings = await SiteSettings.findOne({ tenant: tenantId });
      if (settings?.navbar?.brandName) storeName = settings.navbar.brandName;
    } catch (e) {
      // Non-blocking fallback
    }

    const newTicketStatus = status || query.status || "Updated";

    // -------------------------------------------------------------
    // SAFEGUARD 1: WhatsApp Notification (Non-blocking Try-Catch)
    // -------------------------------------------------------------
    try {
      const validPhone = cleanPhoneNumber(query.phone);
      if (validPhone) {
        const waMsg = getInquiryWhatsAppText({
          storeName,
          query,
          newStatus: newTicketStatus,
          adminNotes: adminNotes !== undefined ? adminNotes : query.adminNotes
        });

        // Background queue insert (Never blocks response)
        queueMessage({
          tenantId,
          orderId: `TICKET-${query._id.toString().slice(-6)}`,
          recipientNumber: validPhone,
          recipientType: "customer",
          triggerType: "inquiry_status_updated",
          messageBody: waMsg
        }).catch((err) => {
          console.warn("⚠️ WhatsApp queue non-fatal warning:", err.message);
        });
      } else {
        console.log(`ℹ️ Ticket #${query._id}: Mobile number "${query.phone}" 10-digit standard format me nahi hai, WhatsApp skip kiya gaya.`);
      }
    } catch (waErr) {
      console.warn("⚠️ WhatsApp dispatch safe catch:", waErr.message);
    }

    // -------------------------------------------------------------
    // SAFEGUARD 2: Email Notification (Non-blocking Try-Catch)
    // -------------------------------------------------------------
    try {
      if (isValidEmail(query.email)) {
        const emailHtml = getInquiryEmailHtml({
          storeName,
          query,
          newStatus: newTicketStatus,
          adminNotes: adminNotes !== undefined ? adminNotes : query.adminNotes
        });

        queueEmail({
          tenantId,
          to: query.email.trim().toLowerCase(),
          subject: `🎫 Support Ticket Update [${newTicketStatus}]: ${query.subject || "Customer Inquiry"}`,
          htmlBody: emailHtml,
          triggerType: "inquiry_status",
          referenceId: query._id.toString()
        }).catch((err) => {
          console.warn("⚠️ Email queue non-fatal warning:", err.message);
        });
      } else {
        console.log(`ℹ️ Ticket #${query._id}: Email "${query.email}" invalid hai, Email skip kiya gaya.`);
      }
    } catch (emailErr) {
      console.warn("⚠️ Email dispatch safe catch:", emailErr.message);
    }

    // Har halat me success 200 return karein taaki admin UI refresh ho sake
    return res.status(200).json({
      success: true,
      message: "Ticket status safaltapoorvak update ho gaya!",
      data: query
    });
  } catch (error) {
    console.error("updateQueryStatus Fatal Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 4. DELETE SINGLE TICKET
// =========================================================================
exports.deleteQuery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const queryFilter = { _id: req.params.id };
    if (tenantId) queryFilter.tenant = tenantId;

    const query = await ContactQuery.findOneAndDelete(queryFilter);
    if (!query) return res.status(404).json({ success: false, message: "Ticket nahi mila." });

    return res.status(200).json({
      success: true,
      message: "Ticket safaltapoorvak delete ho gaya."
    });
  } catch (error) {
    console.error("deleteQuery Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 5. BULK DELETE TICKETS
// =========================================================================
exports.bulkDeleteQueries = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { ticketIds, deleteAllClosed } = req.body;

    let deleteFilter = {};
    if (tenantId) deleteFilter.tenant = tenantId;

    if (deleteAllClosed) {
      deleteFilter.status = { $in: ["Closed", "Resolved"] };
    } else if (Array.isArray(ticketIds) && ticketIds.length > 0) {
      deleteFilter._id = { $in: ticketIds };
    } else {
      return res.status(400).json({
        success: false,
        message: "Delete karne ke liye ticket IDs specify karein."
      });
    }

    const result = await ContactQuery.deleteMany(deleteFilter);

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} tickets delete kar diye gaye!`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("bulkDeleteQueries Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};