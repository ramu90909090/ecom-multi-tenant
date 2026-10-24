const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const cmsController = require("../controllers/contactCmsController");
const crmController = require("../controllers/contactCrmController");
const {
  querySubmissionRules,
  cmsConfigUpdateRules,
  validate
} = require("../validators/contactValidator");

const adminAuth = [authMiddleware, roleMiddleware("admin")];

// 1. Public Endpoints
router.get("/config", cmsController.getContactConfig);
router.post("/query", querySubmissionRules, validate, crmController.submitQuery);

// 2. Admin CMS Controls (Banner, Map, Cards, FAQs)
router.put(
  "/config/general",
  adminAuth,
  cmsConfigUpdateRules,
  validate,
  cmsController.updateGeneralConfig
);
router.post("/config/cards", adminAuth, cmsController.addCard);
router.put("/config/cards/:cardId", adminAuth, cmsController.updateCard);
router.delete("/config/cards/:cardId", adminAuth, cmsController.deleteCard);

router.post("/config/faqs", adminAuth, cmsController.addFaq);
router.put("/config/faqs/:faqId", adminAuth, cmsController.updateFaq);
router.delete("/config/faqs/:faqId", adminAuth, cmsController.deleteFaq);

// 3. Admin CRM Ticket Controls
router.get("/queries", adminAuth, crmController.getAllQueries);
router.patch("/queries/:id", adminAuth, crmController.updateQueryStatus);
router.delete("/queries/bulk-delete", adminAuth, crmController.bulkDeleteQueries); // Bulk Delete Endpoint
router.delete("/queries/:id", adminAuth, crmController.deleteQuery);

module.exports = router;