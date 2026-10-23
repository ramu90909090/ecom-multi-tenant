const { body, validationResult } = require("express-validator");

const productValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name zaroori hai")
    .isLength({ max: 120 })
    .withMessage("Name 120 characters se zyada nahi ho sakta")
    .escape(),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category select karna anivarya hai")
    .isIn(["Electronics", "Fashion", "Footwear", "Home", "Accessories"])
    .withMessage("Invalid Category"),
  body("price")
    .notEmpty()
    .withMessage("Price required hai")
    .isFloat({ min: 0 })
    .withMessage("Price negative nahi ho sakta"),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 90 })
    .withMessage("Discount 0% se 90% ke beech hona chahiye"),
  body("stock")
    .notEmpty()
    .withMessage("Stock count zaroori hai")
    .isInt({ min: 0 })
    .withMessage("Stock positive integer hona chahiye"),
  body("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating 1.0 se 5.0 ke beech honi chahiye"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description dena zaroori hai")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description kam se kam 10 characters ka hona chahiye")
    .escape()
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

module.exports = { productValidationRules, validate };