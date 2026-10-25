const WhatsappLog = require("../models/WhatsappLog");
const whatsappService = require("../services/whatsappService");
const { processQueue } = require("../services/queueService");

// 1. Get Session Status
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

// 2. Reconnect Session
exports.reconnectSession = async (req, res) => {
  try {
    await whatsappService.reconnectExistingSession();
    res.status(200).json({ success: true, message: "Reconnecting to existing session..." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Start Fresh Session
exports.startNewSession = async (req, res) => {
  try {
    await whatsappService.resetAndStartNewSession();
    const deleteResult = await WhatsappLog.deleteMany({ tenant: req.tenant._id });
    res.status(200).json({
      success: true,
      message: `Fresh QR generation triggered. Cleared ${deleteResult.deletedCount} old logs.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Logout Session
exports.logoutSession = async (req, res) => {
  try {
    await whatsappService.disconnectClient();
    res.status(200).json({ success: true, message: "WhatsApp disconnected." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Logs (Tenant Scoped + Supports TICKET IDs)
exports.getWhatsappLogs = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { search, status, triggerType, page = 1, limit = 10 } = req.query;
    let query = { tenant: tenantId };

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ orderId: regex }, { recipientNumber: regex }, { messageBody: regex }];
    }

    if (status && status !== "All") query.status = status;
    if (triggerType && triggerType !== "All") query.triggerType = triggerType;

    const currentPage = Number(page);
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

// 6. Retry Failed / Pending WhatsApp Message (Orders & Support Tickets)
exports.retryMessage = async (req, res) => {
  try {
    const log = await WhatsappLog.findOne({ _id: req.params.id, tenant: req.tenant._id });
    if (!log) return res.status(404).json({ success: false, message: "Log nahi mila" });

    log.status = "Pending";
    log.retries = 0;
    log.errorReason = "";
    await log.save();

    // Trigger queue runner immediately
    processQueue();
    res.status(200).json({ success: true, message: "Message dobara queue me add ho gaya." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Bulk Delete Logs
exports.bulkDeleteLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: "Koi log select nahi kiya." });
    }

    await WhatsappLog.deleteMany({ _id: { $in: ids }, tenant: req.tenant._id });
    res.status(200).json({ success: true, message: `${ids.length} logs delete kar diye gaye.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};