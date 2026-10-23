const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Authentication token missing"
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "production_secure_multitenant_jwt_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    // Tenant Isolation Check on User Tokens
    if (decoded.tenantId && req.tenant && decoded.tenantId.toString() !== req.tenant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized for this specific tenant domain."
      });
    }

    req.user = decoded; // { id, role, tenantId }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired session token. Please log in again."
    });
  }
};