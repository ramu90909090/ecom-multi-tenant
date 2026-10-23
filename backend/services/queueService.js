const WhatsappLog = require("../models/WhatsappLog");
const whatsappService = require("./whatsappService");

let isProcessingQueue = false;

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
    console.error("Queue insertion error:", err);
  }
};

const processQueue = async () => {
  if (isProcessingQueue) return;
  if (whatsappService.getClientStatus() !== "READY") return;

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

    if (!formattedPhone) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Invalid mobile number format.";
      await pendingLog.save();
      isProcessingQueue = false;
      return processQueue();
    }

    const isRegistered = await whatsappService.isUserRegisteredOnWhatsApp(formattedPhone);

    if (!isRegistered) {
      pendingLog.status = "Not Reachable";
      pendingLog.errorReason = "Number is not registered on WhatsApp.";
      await pendingLog.save();
      isProcessingQueue = false;
      return setTimeout(processQueue, 1500);
    }

    try {
      await whatsappService.sendTextMessage(formattedPhone, pendingLog.messageBody);
      pendingLog.status = "Sent";
      pendingLog.sentAt = new Date();
      pendingLog.errorReason = "";
      await pendingLog.save();
    } catch (sendError) {
      pendingLog.retries += 1;
      pendingLog.errorReason = sendError.message || "Failed to deliver message";
      pendingLog.status = pendingLog.retries >= pendingLog.maxRetries ? "Not Reachable" : "Failed";
      await pendingLog.save();
    }

    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 2500);
  } catch (globalError) {
    console.error("Queue Processor Error:", globalError);
    isProcessingQueue = false;
  }
};

module.exports = {
  queueMessage,
  processQueue
};