const EmailQueue = require("../models/EmailQueue");
const { sendMail } = require("./mailService");

let isProcessing = false;

const queueEmail = async ({ tenantId, to, subject, htmlBody, triggerType, referenceId }) => {
  try {
    const queueItem = await EmailQueue.create({
      tenant: tenantId || null,
      recipientEmail: to,
      subject,
      htmlBody,
      triggerType: triggerType || "general",
      referenceId: referenceId || "",
      status: "pending"
    });

    // Background processor kick off
    setImmediate(() => {
      processEmailQueue();
    });

    return queueItem;
  } catch (error) {
    console.error("queueEmail Error:", error.message);
    throw error;
  }
};

const processEmailQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const pendingItems = await EmailQueue.find({
      status: { $in: ["pending", "failed"] },
      attempts: { $lt: 4 }
    })
      .sort({ createdAt: 1 })
      .limit(10);

    for (const item of pendingItems) {
      try {
        item.status = "processing";
        item.attempts += 1;
        await item.save();

        const result = await sendMail({
          tenantId: item.tenant,
          to: item.recipientEmail,
          subject: item.subject,
          htmlBody: item.htmlBody
        });

        item.status = "sent";
        item.sentAt = new Date();
        item.lastError = "";
        await item.save();
        console.log(`📧 Email sent to ${item.recipientEmail} via [${result.provider}]`);
      } catch (err) {
        item.status = item.attempts >= 4 ? "failed_permanently" : "failed";
        item.lastError = err.message;
        await item.save();
        console.warn(`⚠️ Email send failed to ${item.recipientEmail}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error("processEmailQueue Error:", error.message);
  } finally {
    isProcessing = false;
  }
};

module.exports = {
  queueEmail,
  processEmailQueue
};