const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, storeName = "Store Security" }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("⚠️ Warning: EMAIL_USER ya EMAIL_PASS .env me set nahi hai. Mail send bypass (Console print):");
      console.log(`To: ${to} | Subject: ${subject} | Content: ${html}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"${storeName}" <${emailUser}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Email dispatch service error");
  }
};

module.exports = sendEmail;