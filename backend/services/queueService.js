const WhatsappLog = require("../models/WhatsappLog");
const whatsappService = require("./whatsappService");

let isProcessingQueue = false;

// 1. Add message into DB queue
const queueMessage = async ({
  tenantId,
  orderId,
  recipientNumber,
  recipientType,
  triggerType,
  messageBody
}) => {
  try {
    const log = await WhatsappLog.create({
      tenant: tenantId,
      orderId,
      recipientNumber,
      recipientType,
      triggerType,
      messageBody,
      status: "Pending"
    });

    processQueue();
    return log;
  } catch (err) {
    console.error("Queue insertion error:", err.message);
  }
};

// 2. Safe FIFO Queue Runner with Anti-Crash Checks
const processQueue = async () => {
  if (isProcessingQueue) return;
  if (whatsappService.getClientStatus() !== "READY") {
    return; // WhatsApp offline hone par crash na karein
  }

  isProcessingQueue = true;

  try {
    const pendingLog = await WhatsappLog.findOne({
      status: { $in: ["Pending", "Failed"] },
      retries: { $lt: 3 }
    }).sort({ createdAt: 1 });

    if (!pendingLog) {
      isProcessingQueue = false;
      return;
    }

    const formattedPhone = whatsappService.formatWhatsAppNumber(pendingLog.recipientNumber);

    // Agar phone format invalid ho
    if (!formattedPhone) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Invalid mobile number format.";
      await pendingLog.save();
      isProcessingQueue = false;
      return processQueue();
    }

    // WhatsApp par number register hai ya nahi check karein
    let isRegistered = false;
    try {
      isRegistered = await whatsappService.isUserRegisteredOnWhatsApp(formattedPhone);
    } catch (checkErr) {
      console.warn(`Registration check failed for ${formattedPhone}:`, checkErr.message);
      isRegistered = false;
    }

    // Agar number WhatsApp par nahi hai
    if (!isRegistered) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Number is not registered on WhatsApp.";
      await pendingLog.save();
      console.log(`ℹ️ [WhatsApp Queue] Skipped: ${pendingLog.recipientNumber} is not on WhatsApp.`);

      isProcessingQueue = false;
      return setTimeout(processQueue, 1500);
    }

    // Message dispatch karein
    try {
      await whatsappService.sendTextMessage(formattedPhone, pendingLog.messageBody);
      pendingLog.status = "Sent";
      pendingLog.sentAt = new Date();
      pendingLog.errorReason = "";
      await pendingLog.save();
      console.log(`📤 WhatsApp sent to ${pendingLog.recipientNumber} for [${pendingLog.orderId}]`);
    } catch (sendError) {
      pendingLog.retries += 1;
      pendingLog.errorReason = sendError.message || "Failed to deliver message";
      pendingLog.status = pendingLog.retries >= pendingLog.maxRetries ? "Not Reachable" : "Failed";
      await pendingLog.save();
    }

    // 2.5 second gap taaki WhatsApp block na kare
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