const User = require("../models/User");
const Otp = require("../models/Otp");
const SiteSettings = require("../models/SiteSettings");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "production_secure_multitenant_jwt_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const getStoreName = async (tenantId) => {
  try {
    const settings = await SiteSettings.findOne({ tenant: tenantId });
    return settings?.navbar?.brandName || "KHASTORE";
  } catch (err) {
    return "KHASTORE";
  }
};

// ==========================================
// 1. REGISTER (Validate & Send Registration OTP)
// ==========================================
exports.register = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant store identify nahi ho saka." });
    }

    const { email } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    // Check existing user for this tenant
    const existingUser = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Yeh email pehle se registered hai. Kripya login karein." 
      });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const storeName = req.tenant?.storeName || "KHASTORE";

    // Delete any old pending registration OTP
    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "registration" });
    await Otp.create({ tenant: tenantId, email: cleanEmail, otp: hashedOtp, purpose: "registration" });

    // Try sending email, catch error silently so dev mode doesn't hang
    try {
      await sendEmail({
        to: cleanEmail,
        subject: `Your Registration OTP - ${storeName}`,
        storeName,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ec4899;">${storeName} Account Verification</h2>
            <p>Apna naya account verify karne ke liye niche diya gaya OTP enter karein:</p>
            <div style="font-size: 26px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; margin: 16px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 13px;">Yeh code sirf <b>3 minutes</b> ke liye valid hai.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn("⚠️ Mail send warning (Bypassed for Dev):", mailErr.message);
      console.log(`🔑 [DEV MODE OTP FOR ${cleanEmail}]: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: "OTP aapke email par bhej diya gaya hai. Kripya 3 minute ke andar verify karein."
    });
  } catch (error) {
    console.error("register Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Registration initiate karne me server error aaya." 
    });
  }
};
// server/controllers/authController.js ke verifyRegistrationOtp function ko replace karein:

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant store identify nahi ho saka." });
    }

    const { email, otp, userData } = req.body;

    if (!email || !otp || !userData) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP aur user details required hain."
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Check if user already registered for this tenant
    const existingUser = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Yeh email pehle se registered hai. Kripya login karein."
      });
    }

    // 2. Fetch OTP from DB
    const otpDoc = await Otp.findOne({ tenant: tenantId, email: cleanEmail, purpose: "registration" });
    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "OTP expire ho gaya hai (3-minute time limit). Kripya 'Resend OTP' par click karein."
      });
    }

    // 3. Verify OTP
    const isValid = await bcrypt.compare(cleanOtp, otpDoc.otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Galat OTP enter kiya gaya hai."
      });
    }

    // 4. Sanitize: confirmPassword ko strictly filter karein
    const { confirmPassword, ...validUserData } = userData;

    // 5. Create Verified User
    const newUser = await User.create({
      tenant: tenantId,
      name: validUserData.name,
      email: cleanEmail,
      mobile: validUserData.mobile,
      address: validUserData.address,
      pincode: validUserData.pincode,
      state: validUserData.state,
      district: validUserData.district || validUserData.city,
      password: validUserData.password,
      isVerified: true,
      role: "user"
    });

    // 6. Delete OTP after use
    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "registration" });

    return res.status(201).json({
      success: true,
      message: "Account safaltapoorvak ban gaya hai! Ab login karein.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("verifyRegistrationOtp Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration verify karne me error aaya."
    });
  }
};

exports.login = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { email, password } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email ya password." });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const storeName = await getStoreName(tenantId);

    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "login" });
    await Otp.create({ tenant: tenantId, email: cleanEmail, otp: hashedOtp, purpose: "login" });

    await sendEmail({
      to: cleanEmail,
      subject: `Login Verification OTP - ${storeName}`,
      storeName,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ec4899;">${storeName} Secure Login</h2>
          <p>Login complete karne ke liye 2-Step OTP:</p>
          <div style="font-size: 26px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">Yeh code sirf <b>3 minutes</b> ke liye valid hai.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: "Login verification OTP aapke registered email par bhej diya gaya hai."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { email, otp } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    const otpDoc = await Otp.findOne({ tenant: tenantId, email: cleanEmail, purpose: "login" });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP expire ho gaya hai. Resend karein." });
    }

    const isValid = await bcrypt.compare(cleanOtp, otpDoc.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Galat OTP enter kiya gaya hai." });
    }

    const user = await User.findOne({ tenant: tenantId, email: cleanEmail }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User account exist nahi karta." });
    }

    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "login" });

    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenant },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// server/controllers/authController.js ke resendOtp function ko isse replace karein:
exports.resendOtp = async (req, res) => {
  try {
    const tenantId = req.tenant?._id;
    const { email, purpose } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPurpose = String(purpose || "registration").trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email zaroori hai." });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const storeName = req.tenant?.storeName || "KHASTORE";

    const query = { email: cleanEmail, purpose: cleanPurpose };
    if (tenantId) query.tenant = tenantId;

    // Purana OTP hata kar naya OTP create karein
    await Otp.deleteMany(query);
    await Otp.create({
      ...(tenantId ? { tenant: tenantId } : {}),
      email: cleanEmail,
      otp: hashedOtp,
      purpose: cleanPurpose
    });

    // Send email (development mode safety ke sath)
    try {
      await sendEmail({
        to: cleanEmail,
        subject: `Fresh Verification OTP [${cleanPurpose.toUpperCase()}] - ${storeName}`,
        storeName,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ec4899;">${storeName} Verification Code</h2>
            <p>Aapka naya security OTP code:</p>
            <div style="font-size: 26px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; margin: 16px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 13px;">Yeh code sirf <b>3 minutes</b> ke liye valid hai.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.warn("⚠️ Mail send bypass (Dev mode):", mailErr.message);
      console.log(`🔑 [RESENT OTP FOR ${cleanEmail}]: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: "Naya OTP email par bhej diya gaya hai."
    });
  } catch (error) {
    console.error("resendOtp Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "OTP resend fail ho gaya."
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { email } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "Yeh email kisi registered account se match nahi karta." });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const storeName = await getStoreName(tenantId);

    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "forgot_password" });
    await Otp.create({ tenant: tenantId, email: cleanEmail, otp: hashedOtp, purpose: "forgot_password" });

    await sendEmail({
      to: cleanEmail,
      subject: `Password Reset OTP - ${storeName}`,
      storeName,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ec4899;">${storeName} Password Reset Request</h2>
          <p>Password reset verify karne ke liye code:</p>
          <div style="font-size: 26px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">Yeh code sirf <b>3 minutes</b> tak chalega.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: "Password reset OTP email par bhej diya gaya hai." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { email, otp, newPassword } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Naya password kam se kam 6 characters ka hona chahiye." });
    }

    const otpDoc = await Otp.findOne({ tenant: tenantId, email: cleanEmail, purpose: "forgot_password" });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP expire ho gaya hai." });
    }

    const isValid = await bcrypt.compare(cleanOtp, otpDoc.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Galat OTP enter kiya gaya hai." });
    }

    const user = await User.findOne({ tenant: tenantId, email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account nahi mila." });
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteMany({ tenant: tenantId, email: cleanEmail, purpose: "forgot_password" });

    res.status(200).json({
      success: true,
      message: "Password update ho gaya hai! Ab aap login kar sakte hain."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const tenantId = req.tenant._id;
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential token missing hai." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;
    const cleanEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ tenant: tenantId, email: cleanEmail });

    if (!user) {
      user = await User.create({
        tenant: tenantId,
        name: name || "Google User",
        email: cleanEmail,
        mobile: "N/A",
        address: "Google Sign-In Account",
        pincode: "000000",
        state: "N/A",
        district: "N/A",
        password: crypto.randomBytes(16).toString("hex"),
        isVerified: true,
        role: "user"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenant },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "Google login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Google authentication error" });
  }
};

// ==========================================
// GET USER PROFILE (Safe Non-blocking)
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(200).json({ success: false, data: null, user: null });
    }

    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "production_secure_multitenant_jwt_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    const query = { _id: decoded.id };
    if (req.tenant?._id) query.tenant = req.tenant._id;

    const user = await User.findOne(query).select("-password");
    if (!user) {
      return res.status(200).json({ success: false, data: null, user: null });
    }

    return res.status(200).json({ success: true, data: user, user });
  } catch (error) {
    return res.status(200).json({ success: false, data: null, user: null });
  }
};

// ==========================================
// UPDATE USER PROFILE DETAILS
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const tenantId = req.tenant?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in again." });
    }

    const { name, mobile, address, pincode, state, district } = req.body;

    const query = { _id: userId };
    if (tenantId) query.tenant = tenantId;

    const updatedUser = await User.findOneAndUpdate(
      query,
      {
        $set: {
          name: name ? String(name).trim() : undefined,
          mobile: mobile ? String(mobile).trim() : undefined,
          address: address ? String(address).trim() : undefined,
          pincode: pincode ? String(pincode).trim() : undefined,
          state: state ? String(state).trim() : undefined,
          district: district ? String(district).trim() : undefined
        }
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User account nahi mila." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile details safaltapoorvak update ho gayi!",
      user: updatedUser,
      data: updatedUser
    });
  } catch (error) {
    console.error("updateProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Profile update karne me error aaya."
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};