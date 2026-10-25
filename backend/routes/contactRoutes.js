const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");

const cmsController = require("../controllers/contactCmsController");
const crmController = require("../controllers/contactCrmController");

// Public Endpoints (Tenant Scoped by subdomain/header)
router.get("/config", tenantMiddleware, cmsController.getContactConfig);
router.post("/query", tenantMiddleware, crmController.submitQuery);

// Admin Protected Endpoints
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];

// 1. General CMS (Banner, Map, Form)
router.put("/config/general", adminAuth, cmsController.updateGeneralConfig);

// 2. Cards CRUD
router.post("/config/cards", adminAuth, cmsController.addCard);
router.put("/config/cards/:cardId", adminAuth, cmsController.updateCard);
router.delete("/config/cards/:cardId", adminAuth, cmsController.deleteCard);

// 3. FAQ CRUD
router.post("/config/faqs", adminAuth, cmsController.addFaq);
router.put("/config/faqs/:faqId", adminAuth, cmsController.updateFaq);
router.delete("/config/faqs/:faqId", adminAuth, cmsController.deleteFaq);

// 4. Ticket CRM Controls
router.get("/queries", adminAuth, crmController.getAllQueries);
router.patch("/queries/:id", adminAuth, crmController.updateQueryStatus);
router.delete("/queries/bulk-delete", adminAuth, crmController.bulkDeleteQueries);
router.delete("/queries/:id", adminAuth, crmController.deleteQuery);

module.exports = router;