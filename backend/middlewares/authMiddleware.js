const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check Signed / Regular Cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 3. Fallback Header (x-auth-token)
    else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        success: false,
        message: "Access Denied: Authentication token missing. Kripya login karein."
      });
    }

    const secret =
      process.env.JWT_SECRET ||
      "production_secure_multitenant_jwt_secret_key_2026";

    // Verify token
    const decoded = jwt.verify(token, secret);

    // Fetch user from database
    const query = { _id: decoded.id };
    if (req.tenant?._id) {
      query.tenant = req.tenant._id;
    }

    const user = await User.findOne(query).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session invalid ya user account nahi mila."
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid ya expired token. Kripya dobara login karein."
    });
  }
};