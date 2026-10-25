const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const { queueMessage } = require("../services/queueService");
const { queueEmail } = require("../services/emailQueueService");
const bcrypt = require("bcryptjs");

// Helper: 10-digit Indian Mobile Sanitizer
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

// Helper: Email Validator
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Helper: Resolve Dynamic Store Name
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
// 1. GET ALL USERS (Tenant-Scoped, Search, Filter & Pagination)
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    let filter = tenantId ? { tenant: tenantId } : {};

    const {
      search,
      role,
      isVerified,
      page = 1,
      limit = 10,
      sortBy = "createdAt-desc"
    } = req.query;

    if (role && role !== "All") filter.role = role;
    if (isVerified && isVerified !== "All") {
      filter.isVerified = isVerified === "true";
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    else if (sortBy === "name-asc") sortOptions = { name: 1 };
    else if (sortBy === "name-desc") sortOptions = { name: -1 };

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (currentPage - 1) * perPage;

    const [users, totalUsers, adminCount, customerCount, verifiedCount] = await Promise.all([
      User.find(filter).select("-password").sort(sortOptions).skip(skip).limit(perPage),
      User.countDocuments(filter),
      User.countDocuments({ ...filter, role: "admin" }),
      User.countDocuments({ ...filter, role: "user" }),
      User.countDocuments({ ...filter, isVerified: true })
    ]);

    const totalPages = Math.ceil(totalUsers / perPage) || 1;

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        page: currentPage,
        limit: perPage,
        totalPages
      },
      stats: {
        totalUsers,
        adminCount,
        customerCount,
        verifiedCount
      }
    });
  } catch (error) {
    console.error("getAllUsers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. CREATE NEW USER (By Admin)
// ==========================================
exports.createUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { name, email, mobile, password, role = "user", isVerified = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email aur password anivarya hain." });
    }

    // Check existing email within this tenant
    const existing = await User.findOne({ email: email.toLowerCase().trim(), tenant: tenantId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Is email ka account pehle se maujood hai." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      tenant: tenantId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile?.trim() || "",
      password: hashedPassword,
      role,
      isVerified
    });

    const storeName = await getStoreName(req.tenant);

    // Welcome Alert on WhatsApp
    const validPhone = cleanPhoneNumber(user.mobile);
    if (validPhone) {
      const waMsg =
        `🎉 *ACCOUNT CREATED - ${storeName.toUpperCase()}*\n\n` +
        `Namaste *${user.name}*ji,\n\n` +
        `Aapka user account ${storeName} par create kar diya gaya hai.\n` +
        `👤 *Login Email:* ${user.email}\n` +
        `🛡️ *Role:* ${user.role.toUpperCase()}\n\n` +
        `Aap store me login karke shopping shuru kar sakte hain.\n` +
        `Team *${storeName}*`;

      queueMessage({
        tenantId,
        orderId: `USER-${user._id.toString().slice(-6)}`,
        recipientNumber: validPhone,
        recipientType: "customer",
        triggerType: "inquiry_status_updated",
        messageBody: waMsg
      }).catch((e) => console.warn("WhatsApp welcome fail:", e.message));
    }

    // Welcome Alert on Email
    if (isValidEmail(user.email)) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5; text-align: center;">${storeName}</h2>
          <p>Namaste <b>${user.name}</b>,</p>
          <p>Aapka naya account successfully create ho chuka hai.</p>
          <div style="background: #f8fafc; padding: 14px; border-radius: 10px; margin: 15px 0;">
            <p style="margin: 4px 0;"><b>Login Email:</b> ${user.email}</p>
            <p style="margin: 4px 0;"><b>Role:</b> ${user.role.toUpperCase()}</p>
          </div>
          <p style="color: #64748b; font-size: 12px;">Kisi bhi query ke liye support desk se sampark karein.</p>
        </div>`;

      queueEmail({
        tenantId,
        to: user.email,
        subject: `🎉 Welcome to ${storeName} - Account Created`,
        htmlBody: html,
        triggerType: "general",
        referenceId: user._id.toString()
      }).catch((e) => console.warn("Email welcome fail:", e.message));
    }

    return res.status(201).json({
      success: true,
      message: "User safaltapoorvak create ho gaya!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("createUser Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. UPDATE USER DETAILS (Admin update with instant alerts)
// ==========================================
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { name, mobile, role, isVerified, newPassword } = req.body;

    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila." });

    const changes = [];

    if (name && name !== user.name) {
      changes.push(`Name changed to: ${name}`);
      user.name = name.trim();
    }
    if (mobile !== undefined && mobile !== user.mobile) {
      changes.push(`Mobile updated to: ${mobile}`);
      user.mobile = mobile.trim();
    }
    if (role && role !== user.role) {
      changes.push(`Role updated to: ${role.toUpperCase()}`);
      user.role = role;
    }
    if (isVerified !== undefined && isVerified !== user.isVerified) {
      changes.push(`Account Status: ${isVerified ? "Verified ✅" : "Suspended / Unverified ⚠️"}`);
      user.isVerified = isVerified;
    }
    if (newPassword && newPassword.trim()) {
      user.password = await bcrypt.hash(newPassword.trim(), 10);
      changes.push("Account Password was reset by Administrator 🔑");
    }

    await user.save();
    const storeName = await getStoreName(req.tenant);

    // Alert dispatch if modifications occurred
    if (changes.length > 0) {
      const summaryText = changes.map((c) => `• ${c}`).join("\n");

      // 1. WhatsApp Security Notice
      const validPhone = cleanPhoneNumber(user.mobile);
      if (validPhone) {
        const waMsg =
          `🔔 *PROFILE SECURITY ALERT - ${storeName.toUpperCase()}*\n\n` +
          `Namaste *${user.name}*ji,\n\n` +
          `Aapke account credentials me administrator dwara badlav kiye gaye hain:\n\n` +
          `${summaryText}\n\n` +
          `Agar yeh badlav aapke knowledge me nahi hain, to turant support desk par sampark karein.\n` +
          `Team *${storeName}*`;

        queueMessage({
          tenantId,
          orderId: `SEC-${user._id.toString().slice(-6)}`,
          recipientNumber: validPhone,
          recipientType: "customer",
          triggerType: "inquiry_status_updated",
          messageBody: waMsg
        }).catch((e) => console.warn("WhatsApp security alert warning:", e.message));
      }

      // 2. Email Security Notice
      if (isValidEmail(user.email)) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #4f46e5; text-align: center;">${storeName}</h2>
            <p>Namaste <b>${user.name}</b>,</p>
            <p>Aapke profile details ko store administrator dwara update kiya gaya hai:</p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 10px; margin: 15px 0;">
              ${changes.map((c) => `<p style="margin: 4px 0; color: #1e293b; font-size: 13px;">✔ ${c}</p>`).join("")}
            </div>
            <p style="color: #dc2626; font-size: 12px;">Agar yeh changes aapke authorization ke bina huye hain, to kripya turant support se sampark karein.</p>
          </div>`;

        queueEmail({
          tenantId,
          to: user.email,
          subject: `🔔 Account Profile Update Notice - ${storeName}`,
          htmlBody: html,
          triggerType: "general",
          referenceId: user._id.toString()
        }).catch((e) => console.warn("Email security alert warning:", e.message));
      }
    }

    return res.status(200).json({
      success: true,
      message: "User details update ho gayi aur notification bhej diya gaya!",
      data: user
    });
  } catch (error) {
    console.error("updateUser Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. DELETE USER (With Self-Delete Protection)
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const adminId = req.user?._id || req.user?.id;

    if (String(adminId) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: "Aap apna khud ka account delete nahi kar sakte." });
    }

    const query = { _id: req.params.id };
    if (tenantId) query.tenant = tenantId;

    const user = await User.findOneAndDelete(query);
    if (!user) return res.status(404).json({ success: false, message: "User nahi mila." });

    return res.status(200).json({
      success: true,
      message: `User ${user.name} safaltapoorvak delete kar diya gaya.`
    });
  } catch (error) {
    console.error("deleteUser Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. SEND DIRECT CUSTOM NOTIFICATION (WhatsApp + Email Dual Trigger)
// ==========================================
exports.sendCustomNotification = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { userId, subject, messageText } = req.body;

    if (!userId || !messageText) {
      return res.status(400).json({ success: false, message: "User ID aur messageText anivarya hain." });
    }

    const query = { _id: userId };
    if (tenantId) query.tenant = tenantId;

    const targetUser = await User.findOne(query);
    if (!targetUser) return res.status(404).json({ success: false, message: "Target user nahi mila." });

    const storeName = await getStoreName(req.tenant);
    const finalSubject = subject?.trim() || `Important Notice from ${storeName}`;
    let waSent = false;
    let emailSent = false;

    // Trigger WhatsApp
    const validPhone = cleanPhoneNumber(targetUser.mobile);
    if (validPhone) {
      const waMsg =
        `📢 *MESSAGE FROM ${storeName.toUpperCase()}*\n\n` +
        `Namaste *${targetUser.name}*ji,\n\n` +
        (subject ? `📌 *Subject:* ${finalSubject}\n\n` : "") +
        `💬 *Message:* \n"${messageText.trim()}"\n\n` +
        `Kisi bhi query ke liye support desk se sampark karein.\n` +
        `Team *${storeName}*`;

      await queueMessage({
        tenantId,
        orderId: `DIRECT-${targetUser._id.toString().slice(-6)}`,
        recipientNumber: validPhone,
        recipientType: "customer",
        triggerType: "inquiry_status_updated",
        messageBody: waMsg
      });
      waSent = true;
    }

    // Trigger Email
    if (isValidEmail(targetUser.email)) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="color: #4f46e5; margin: 0;">${storeName}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Customer Direct Notice</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; color: #1e293b;">Namaste <b>${targetUser.name}</b>,</p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h4 style="margin: 0 0 10px; color: #1e293b; font-size: 15px;">${finalSubject}</h4>
              <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-wrap;">${messageText.trim()}</p>
            </div>
          </div>
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Thank you for being part of <b>${storeName}</b>.</p>
          </div>
        </div>`;

      await queueEmail({
        tenantId,
        to: targetUser.email,
        subject: `📢 ${finalSubject}`,
        htmlBody: emailHtml,
        triggerType: "general",
        referenceId: targetUser._id.toString()
      });
      emailSent = true;
    }

    return res.status(200).json({
      success: true,
      message: `Message dispatched! (WhatsApp: ${waSent ? "Sent ✅" : "No Phone ❌"}, Email: ${emailSent ? "Sent ✅" : "No Email ❌"})`
    });
  } catch (error) {
    console.error("sendCustomNotification Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};