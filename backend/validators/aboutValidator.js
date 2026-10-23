const { body, validationResult } = require("express-validator");

const aboutConfigUpdateRules = [
  body("hero.badge").optional().trim().escape(),
  body("hero.headingPrefix").optional().trim().escape(),
  body("hero.headingHighlight").optional().trim().escape(),
  body("hero.description").optional().trim().escape(),
  body("founder.name").optional().trim().escape(),
  body("founder.designation").optional().trim().escape(),
  body("founder.quote").optional().trim().escape(),
  body("founder.visionStory").optional().trim().escape(),
  body("cta.heading").optional().trim().escape(),
  body("cta.description").optional().trim().escape(),
  body("cta.buttonText").optional().trim().escape()
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

module.exports = { aboutConfigUpdateRules, validate };