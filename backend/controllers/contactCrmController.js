const ContactQuery = require("../models/ContactQuery");
const SiteSettings = require("../models/SiteSettings");
const { queueMessage } = require("../services/queueService");
const { queueEmail } = require("../services/emailQueueService");

// 10-digit Indian phone sanitizer
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

// Email format validator
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Dynamic Store Name Resolver
const getStoreName = async (tenant) => {
  try {
    if (!tenant?._id) return "Store Support";
    const settings = await SiteSettings.findOne({ tenant: tenant._id });
    return settings?.navbar?.brandName || tenant?.storeName || "Store Support";
  } catch {
    return tenant?.storeName || "Store Support";
  }
};

// ==========================================
// TEMPLATES: TICKET SUBMITTED BY CUSTOMER
// ==========================================
const getInquiryReceivedWhatsAppText = ({ storeName, query, ticketId }) => (
  `🎫 *TICKET SUBMITTED - ${storeName.toUpperCase()}*\n\n` +
  `Namaste *${query.name || "Customer"}*ji,\n\n` +
  `Aapki inquiry hamare support desk par successfully submit ho gayi hai.\n\n` +
  `📌 *Ticket ID:* #${ticketId}\n` +
  `📌 *Subject:* ${query.subject || "General Inquiry"}\n` +
  `📌 *Status:* PENDING REVIEW\n\n` +
  `📝 *Aapka Message:* "${(query.message || "").slice(0, 100)}..."\n\n` +
  `Humari team jald hi aapse sampark karegi.\n` +
  `Dhanyawad,\n*${storeName}*`
);

const getInquiryReceivedEmailHtml = ({ storeName, query, ticketId }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
      <h2 style="color: #4f46e5; margin: 0;">${storeName}</h2>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Customer Support Desk</p>
    </div>
    <div style="padding: 24px 0;">
      <p style="font-size: 15px; color: #1e293b;">Namaste <b>${query.name || "Customer"}</b>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Aapka support ticket register kar liya gaya hai. Humari priority desk jald aapse sampark karegi.
      </p>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: bold;">TICKET REFERENCE: #${ticketId}</p>
        <p style="margin: 0 0 4px; font-size: 14px; color: #1e293b;"><b>Subject:</b> ${query.subject || "General Inquiry"}</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;"><b>Status:</b> <span style="color: #f59e0b; font-weight: bold;">Pending Review</span></p>
      </div>
      <p style="font-size: 13px; color: #475569; font-style: italic;">"${query.message}"</p>
    </div>
    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Thank you for contacting <b>${storeName}</b>.</p>
    </div>
  </div>
`;

// ==========================================
// TEMPLATES: STATUS UPDATED BY ADMIN
// ==========================================
const getInquiryStatusWhatsAppText = ({ storeName, query, newStatus, adminNotes, ticketId }) => {
  let statusEmoji = "🎫";
  if (newStatus === "Resolved") statusEmoji = "✅";
  else if (newStatus === "In Progress") statusEmoji = "⚙️";
  else if (newStatus === "Closed") statusEmoji = "📁";

  return (
    `${statusEmoji} *TICKET STATUS UPDATE - ${storeName.toUpperCase()}*\n\n` +
    `Namaste *${query.name || "Customer"}*ji,\n\n` +
    `Aapke support ticket (*#${ticketId}*) ka status update kiya gaya hai:\n\n` +
    `📍 *New Status:* *${newStatus.toUpperCase()}*\n` +
    (adminNotes ? `💬 *Support Note:* ${adminNotes}\n` : "") +
    `📌 *Subject:* ${query.subject || "General Inquiry"}\n\n` +
    `Kisi bhi anya sahayata ke liye hamare desk par reply karein.\n` +
    `Team *${storeName}*`
  );
};

const getInquiryStatusEmailHtml = ({ storeName, query, newStatus, adminNotes, ticketId }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
      <h2 style="color: #4f46e5; margin: 0;">${storeName}</h2>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Customer Support Desk</p>
    </div>
    <div style="padding: 24px 0;">
      <p style="font-size: 15px; color: #1e293b;">Namaste <b>${query.name || "Customer"}</b>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Aapke inquiry ticket <b>#${ticketId}</b> ka status update hua hai:
      </p>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: bold;">TICKET: #${ticketId} | ${query.subject || "Inquiry"}</p>
        <p style="margin: 0; font-size: 22px; font-weight: 900; color: ${newStatus === "Resolved" ? "#16a34a" : "#4f46e5"};">${newStatus}</p>
        ${adminNotes ? `<div style="margin-top: 12px; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #1e293b;"><b>Support Response:</b> ${adminNotes}</div>` : ""}
      </div>
      <p style="font-size: 12px; color: #94a3b8; font-style: italic;">Original Message: "${query.message}"</p>
    </div>
    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Thank you for contacting <b>${storeName}</b>.</p>
    </div>
  </div>
`;

// =========================================================================
// 1. SUBMIT PUBLIC QUERY (Queue WhatsApp & Email)
// =========================================================================
// Submit query function in server/controllers/contactCrmController.js
exports.submitQuery = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { name, email, phone, subject, message } = req.body;

    const query = await ContactQuery.create({
      tenant: tenantId,
      name,
      email,
      phone,
      subject: subject || "General Inquiry",
      message,
      status: "Pending"
    });

    const storeName = await getStoreName(req.tenant);
    const ticketId = query._id.toString().slice(-6).toUpperCase();

    // 1. WhatsApp Confirmation
    const validPhone = cleanPhoneNumber(phone);
    if (validPhone) {
      const waMsg = getInquiryReceivedWhatsAppText({ storeName, query, ticketId });
      await queueMessage({
        tenantId,
        orderId: `TICKET-${ticketId}`,
        recipientNumber: validPhone,
        recipientType: "customer",
        triggerType: "inquiry_created",
        messageBody: waMsg
      });
    }

    // 2. Email Confirmation
    if (isValidEmail(email)) {
      const emailHtml = getInquiryReceivedEmailHtml({ storeName, query, ticketId });
      queueEmail({
        tenantId,
        to: email.trim().toLowerCase(),
        subject: `✅ Support Ticket Received [#${ticketId}] - ${storeName}`,
        htmlBody: emailHtml,
        triggerType: "inquiry_created",
        referenceId: query._id.toString()
      }).catch((err) => console.warn("Email queue warning:", err.message));
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully. Alerts dispatched via WhatsApp & Email.",
      data: query
    });
  } catch (error) {
    console.error("submitQuery Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 2. GET ALL QUERIES (Admin CRM)
// =========================================================================
exports.getAllQueries = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    let filter = tenantId ? { tenant: tenantId } : {};

    const { status, search, page = 1, limit = 10 } = req.query;

    if (status && status !== "All") filter.status = status;

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

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const [queries, totalQueries, pendingCount, inProgressCount, resolvedCount, closedCount] =
      await Promise.all([
        ContactQuery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
        ContactQuery.countDocuments(filter),
        ContactQuery.countDocuments({ ...filter, status: "Pending" }),
        ContactQuery.countDocuments({ ...filter, status: "In Progress" }),
        ContactQuery.countDocuments({ ...filter, status: "Resolved" }),
        ContactQuery.countDocuments({ ...filter, status: "Closed" })
      ]);

    return res.status(200).json({
      success: true,
      data: queries,
      pagination: {
        total: totalQueries,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(totalQueries / perPage) || 1
      },
      stats: {
        total: totalQueries,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 3. UPDATE QUERY STATUS (Admin updates status -> Triggers WhatsApp & Email)
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

    const storeName = await getStoreName(req.tenant);
    const newStatus = status || query.status;
    const ticketId = query._id.toString().slice(-6).toUpperCase();

    // Trigger WhatsApp status update message & create WhatsAppLog entry
    const validPhone = cleanPhoneNumber(query.phone);
    if (validPhone) {
      const waMsg = getInquiryStatusWhatsAppText({
        storeName,
        query,
        newStatus,
        adminNotes: adminNotes !== undefined ? adminNotes : query.adminNotes,
        ticketId
      });

      // queueMessage calls WhatsappLog.create and triggers FIFO queue
      await queueMessage({
        tenantId,
        orderId: `TICKET-${ticketId}`,
        recipientNumber: validPhone,
        recipientType: "customer",
        triggerType: "inquiry_status_updated",
        messageBody: waMsg
      });
      console.log(`✅ WhatsApp queued for Ticket #${ticketId} to ${validPhone}`);
    } else {
      console.warn(`⚠️ Ticket #${ticketId}: Phone "${query.phone}" invalid hai, WhatsApp skipped.`);
    }

    // Trigger Email status update
    if (isValidEmail(query.email)) {
      const emailHtml = getInquiryStatusEmailHtml({
        storeName,
        query,
        newStatus,
        adminNotes: adminNotes !== undefined ? adminNotes : query.adminNotes,
        ticketId
      });

      queueEmail({
        tenantId,
        to: query.email.trim().toLowerCase(),
        subject: `🎫 Ticket Update [#${ticketId}] [${newStatus}] - ${storeName}`,
        htmlBody: emailHtml,
        triggerType: "inquiry_status",
        referenceId: query._id.toString()
      }).catch((err) => console.warn("Email queue warning:", err.message));
    }

    return res.status(200).json({
      success: true,
      message: "Ticket status update ho gaya aur customer ko WhatsApp & Email alerts queue ho gaye!",
      data: query
    });
  } catch (error) {
    console.error("updateQueryStatus Error:", error);
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
      message: "Ticket delete kar diya gaya."
    });
  } catch (error) {
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
        message: "Delete karne ke liye valid ticket IDs select karein."
      });
    }

    const result = await ContactQuery.deleteMany(deleteFilter);

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} tickets delete kar diye gaye!`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};