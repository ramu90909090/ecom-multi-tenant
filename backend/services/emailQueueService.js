const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

let isProcessingEmailQueue = false;

// 1. Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password"
  }
});

// 2. Add Email into Database Queue
const queueEmail = async ({
  tenantId,
  to,
  subject,
  htmlBody,
  triggerType = "general",
  referenceId = ""
}) => {
  try {
    if (!to || !to.includes("@")) return null;

    const emailItem = await EmailLog.create({
      tenant: tenantId,
      to,
      subject,
      htmlBody,
      triggerType,
      referenceId,
      status: "Pending"
    });

    // Asynchronously trigger processing
    processEmailQueue();
    return emailItem;
  } catch (err) {
    console.error("Email queue insertion error:", err);
  }
};

// 3. FIFO Queue Runner with Retry Mechanism
const processEmailQueue = async () => {
  if (isProcessingEmailQueue) return;
  isProcessingEmailQueue = true;

  try {
    const pendingEmail = await EmailLog.findOne({
      status: { $in: ["Pending", "Failed"] },
      retries: { $lt: 3 }
    }).sort({ createdAt: 1 });

    if (!pendingEmail) {
      isProcessingEmailQueue = false;
      return;
    }

    try {
      await transporter.sendMail({
        from: `"${process.env.APP_NAME || "Store Support"}" <${process.env.EMAIL_USER}>`,
        to: pendingEmail.to,
        subject: pendingEmail.subject,
        html: pendingEmail.htmlBody
      });

      pendingEmail.status = "Sent";
      pendingEmail.sentAt = new Date();
      pendingEmail.errorReason = "";
      await pendingEmail.save();
      console.log(`📧 [Email Queue] Sent to ${pendingEmail.to} (${pendingEmail.triggerType})`);
    } catch (err) {
      pendingEmail.retries += 1;
      pendingEmail.errorReason = err.message || "Failed to deliver email";
      pendingEmail.status = pendingEmail.retries >= pendingEmail.maxRetries ? "Failed" : "Failed";
      await pendingEmail.save();
      console.warn(`⚠️ [Email Queue] Retry ${pendingEmail.retries}/3 for ${pendingEmail.to}`);
    }

    // 1.5-second gap to prevent SMTP rate-limiting
    setTimeout(() => {
      isProcessingEmailQueue = false;
      processEmailQueue();
    }, 1500);
  } catch (globalErr) {
    console.error("Email Queue Processor Error:", globalErr);
    isProcessingEmailQueue = false;
  }
};

module.exports = {
  queueEmail,
  processEmailQueue
};