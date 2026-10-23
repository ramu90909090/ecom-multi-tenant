const WhatsappLog = require("../models/WhatsappLog");
const whatsappService = require("../services/whatsappService");
const { processQueue } = require("../services/queueService");

// 1. Get Live Session Status & Dynamic Connected Admin Phone
exports.getSessionStatus = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: whatsappService.getClientStatus(),
      qrCode: whatsappService.getQrCode(),
      connectedNumber: whatsappService.getConnectedAdminNumber()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Reconnect using saved LocalAuth session
exports.reconnectSession = async (req, res) => {
  try {
    await whatsappService.reconnectExistingSession();
    res.status(200).json({
      success: true,
      message: "Purane session se reconnect kiya ja raha hai..."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Start Fresh Session & Delete All Old WhatsApp Logs for Current Tenant
exports.startNewSession = async (req, res) => {
  try {
    const tenantId = req.tenant._id;

    // Purana puppeteer session cache folder reset karein
    await whatsappService.resetAndStartNewSession();

    // Naya session shuru hote hi is tenant ke puraane sabhi logs delete karein
    const deleteResult = await WhatsappLog.deleteMany({ tenant: tenantId });
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} old WhatsApp logs for Tenant: ${req.tenant.slug}`);

    res.status(200).json({
      success: true,
      message: `Purana session clear ho gaya aur ${deleteResult.deletedCount} puraane logs delete ho gaye. Naya QR ban raha hai...`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Disconnect / Logout Active Session
exports.logoutSession = async (req, res) => {
  try {
    await whatsappService.disconnectClient();
    res.status(200).json({
      success: true,
      message: "WhatsApp session successfully disconnect kar diya gaya."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get WhatsApp Logs (Tenant-Scoped, Pagination, Filters & Search)
exports.getWhatsappLogs = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { search, status, triggerType, page = 1, limit = 10 } = req.query;

    let query = { tenant: tenantId };

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { orderId: regex },
        { recipientNumber: regex },
        { messageBody: regex }
      ];
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (triggerType && triggerType !== "All") {
      query.triggerType = triggerType;
    }

    const currentPage = Math.max(1, Number(page));
    const perPage = Number(limit);
    const skip = (currentPage - 1) * perPage;

    const [logs, total] = await Promise.all([
      WhatsappLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      WhatsappLog.countDocuments(query)
    ]);

    const [sentCount, pendingCount, failedCount, notReachableCount] = await Promise.all([
      WhatsappLog.countDocuments({ tenant: tenantId, status: "Sent" }),
      WhatsappLog.countDocuments({ tenant: tenantId, status: "Pending" }),
      WhatsappLog.countDocuments({ tenant: tenantId, status: "Failed" }),
      WhatsappLog.countDocuments({ tenant: tenantId, status: "Not Reachable" })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        totalPages: Math.ceil(total / perPage) || 1,
        currentPage,
        limit: perPage
      },
      stats: {
        sentCount,
        pendingCount,
        failedCount,
        notReachableCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Retry Single Failed/Pending Message
exports.retryMessage = async (req, res) => {
  try {
    const log = await WhatsappLog.findOne({ _id: req.params.id, tenant: req.tenant._id });
    if (!log) {
      return res.status(404).json({ success: false, message: "WhatsApp Log nahi mila." });
    }

    log.status = "Pending";
    log.retries = 0;
    log.errorReason = "";
    await log.save();

    processQueue();
    res.status(200).json({
      success: true,
      message: "Message dobara queue me add ho gaya hai aur dispatch schedule ho gaya."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Bulk Delete Logs (Multiple checkbox selection)
exports.bulkDeleteLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Koi log ID select nahi ki gayi." });
    }

    const deleteResult = await WhatsappLog.deleteMany({
      _id: { $in: ids },
      tenant: req.tenant._id
    });

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} WhatsApp logs safaltapoorvak delete kar diye gaye.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};