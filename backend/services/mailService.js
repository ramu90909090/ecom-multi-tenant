const nodemailer = require("nodemailer");
const SiteSettings = require("../models/SiteSettings");

/**
 * Get active Nodemailer transporter and sender email dynamically based on DB settings or .env fallback
 */
const getTransporter = async (tenantId) => {
  let settings = null;
  if (tenantId) {
    settings = await SiteSettings.findOne({ tenant: tenantId });
  }
  if (!settings) {
    settings = await SiteSettings.findOne({});
  }

  const mailConfig = settings?.mailConfig;
  const activeProvider = mailConfig?.activeProvider || process.env.DEFAULT_MAIL_PROVIDER || "mailcow";

  // CASE 1: MAILCOW SMTP SERVER (mail.uprcart.com)
  if (activeProvider === "mailcow") {
    const host = mailConfig?.mailcow?.host || process.env.MAILCOW_HOST || "mail.uprcart.com";
    const port = Number(mailConfig?.mailcow?.port || process.env.MAILCOW_PORT || 587);
    const secure = port === 465;
    const user = mailConfig?.mailcow?.user || process.env.MAILCOW_USER;
    const pass = mailConfig?.mailcow?.pass || process.env.MAILCOW_PASS;
    const fromName = mailConfig?.mailcow?.fromName || settings?.navbar?.brandName || "Store Support";
    const fromEmail = mailConfig?.mailcow?.fromEmail || user;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        // Mailcow STARTTLS certificates ko verify karta hai
        rejectUnauthorized: process.env.NODE_ENV === "production"
      }
    });

    return {
      transporter,
      provider: "mailcow",
      from: `"${fromName}" <${fromEmail}>`
    };
  }

  // CASE 2: GMAIL SMTP
  const gmailUser = mailConfig?.gmail?.user || process.env.EMAIL_USER;
  const gmailPass = mailConfig?.gmail?.pass || process.env.EMAIL_PASS;
  const fromName = mailConfig?.gmail?.fromName || settings?.navbar?.brandName || "Store Support";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  return {
    transporter,
    provider: "gmail",
    from: `"${fromName}" <${gmailUser}>`
  };
};

/**
 * Send an email directly using active provider
 */
const sendMail = async ({ tenantId, to, subject, htmlBody, textBody }) => {
  const { transporter, from, provider } = await getTransporter(tenantId);

  const mailOptions = {
    from,
    to,
    subject,
    text: textBody || htmlBody?.replace(/<[^>]*>?/gm, ""),
    html: htmlBody
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId, provider };
};

/**
 * Verify / Test SMTP Connection
 */
const testConnection = async (config) => {
  let transporter;
  if (config.activeProvider === "mailcow") {
    transporter = nodemailer.createTransport({
      host: config.mailcow.host || "mail.uprcart.com",
      port: Number(config.mailcow.port) || 587,
      secure: Number(config.mailcow.port) === 465,
      auth: {
        user: config.mailcow.user,
        pass: config.mailcow.pass
      },
      tls: { rejectUnauthorized: false }
    });
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.gmail.user,
        pass: config.gmail.pass
      }
    });
  }

  return await transporter.verify();
};

module.exports = {
  getTransporter,
  sendMail,
  testConnection
};