const WhatsappLog = require("../models/WhatsappLog");
const whatsappService = require("./whatsappService");

let isProcessingQueue = false;

// 1. Add message into DB queue (Always logs to DB first)
const queueMessage = async ({
  tenantId,
  orderId,
  recipientNumber,
  recipientType = "customer",
  triggerType,
  messageBody
}) => {
  try {
    if (!tenantId) {
      console.warn("⚠️ queueMessage: Missing tenantId, skipping log insertion.");
      return null;
    }

    const log = await WhatsappLog.create({
      tenant: tenantId,
      orderId: String(orderId || "TICKET-GENERAL"),
      recipientNumber: String(recipientNumber).trim(),
      recipientType,
      triggerType,
      messageBody,
      status: "Pending",
      retries: 0,
      errorReason: ""
    });

    console.log(`📥 [WhatsApp Queue] Log created in DB with ID: ${log._id} for ${recipientNumber}`);

    // Trigger queue processing in background
    processQueue();
    return log;
  } catch (err) {
    console.error("❌ Queue insertion error:", err.message);
    return null;
  }
};

// 2. FIFO Queue Runner with Multi-Tenant Support & 3-Retry Mechanism
const processQueue = async () => {
  if (isProcessingQueue) return;

  // WhatsApp client ready check
  if (!whatsappService || whatsappService.getClientStatus() !== "READY") {
    return;
  }

  isProcessingQueue = true;

  try {
    // Pick oldest Pending or Failed log with retries < 3
    const pendingLog = await WhatsappLog.findOne({
      status: { $in: ["Pending", "Failed"] },
      retries: { $lt: 3 }
    }).sort({ createdAt: 1 });

    if (!pendingLog) {
      isProcessingQueue = false;
      return;
    }

    const formattedPhone = whatsappService.formatWhatsAppNumber(pendingLog.recipientNumber);

    if (!formattedPhone) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Invalid mobile number format.";
      await pendingLog.save();
      isProcessingQueue = false;
      return processQueue();
    }

    // Step 2.1: Check WhatsApp registration
    let isRegistered = false;
    try {
      isRegistered = await whatsappService.isUserRegisteredOnWhatsApp(formattedPhone);
    } catch (checkErr) {
      console.warn(`⚠️ Registration check failed for ${formattedPhone}:`, checkErr.message);
      isRegistered = false;
    }

    if (!isRegistered) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Number is not registered on WhatsApp.";
      await pendingLog.save();
      console.log(`ℹ️ [WhatsApp Queue] Skipped: ${pendingLog.recipientNumber} has no WhatsApp account.`);

      isProcessingQueue = false;
      return setTimeout(processQueue, 1500);
    }

    // Step 2.2: Send message
    try {
      await whatsappService.sendTextMessage(formattedPhone, pendingLog.messageBody);

      pendingLog.status = "Sent";
      pendingLog.sentAt = new Date();
      pendingLog.errorReason = "";
      await pendingLog.save();
      console.log(`📤 WhatsApp sent to ${pendingLog.recipientNumber} for Ticket/Order [${pendingLog.orderId}]`);
    } catch (sendError) {
      pendingLog.retries += 1;
      pendingLog.errorReason = sendError.message || "Failed to deliver message";

      if (pendingLog.retries >= pendingLog.maxRetries) {
        pendingLog.status = "Not Reachable";
        console.error(`❌ Max retries reached for ${pendingLog.recipientNumber}. Marked as Not Reachable.`);
      } else {
        pendingLog.status = "Failed";
        console.warn(`🔄 Retry ${pendingLog.retries}/3 for ${pendingLog.recipientNumber}`);
      }

      await pendingLog.save();
    }

    // 2.5 second delay to prevent rate-limiting/spam bans
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 2500);
  } catch (globalError) {
    console.error("Queue Processor Error:", globalError.message);
    isProcessingQueue = false;
  }
};

module.exports = {
  queueMessage,
  processQueue
};