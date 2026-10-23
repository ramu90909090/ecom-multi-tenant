const { body, validationResult } = require("express-validator");

const registerValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("mobile").isMobilePhone("en-IN").withMessage("Valid 10-digit mobile required"),
  body("address").trim().notEmpty().escape(),
  body("pincode").isPostalCode("IN").withMessage("Valid 6-digit Indian PIN required"),
  body("state").trim().notEmpty().escape(),
  body("district").trim().notEmpty().escape(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

module.exports = { registerValidationRules, validate };