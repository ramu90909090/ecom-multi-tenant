const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");
const aboutController = require("../controllers/aboutCmsController");

// Public Endpoint (Tenant-Scoped via tenantMiddleware)
router.get("/config", tenantMiddleware, aboutController.getAboutConfig);

// Admin-Protected Guards
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];

// General Sections (Hero, Founder, CTA)
router.put("/config/general", adminAuth, aboutController.updateGeneralSections);

// Stats CRUD
router.post("/config/stats", adminAuth, aboutController.addStat);
router.put("/config/stats/:statId", adminAuth, aboutController.updateStat);
router.delete("/config/stats/:statId", adminAuth, aboutController.deleteStat);

// Infrastructure Gallery & Multi-image Toggle
router.post("/config/infrastructure", adminAuth, aboutController.addInfraItem);
router.put("/config/infrastructure/:infraId", adminAuth, aboutController.updateInfraItem);
router.delete("/config/infrastructure/:infraId", adminAuth, aboutController.deleteInfraItem);
router.patch("/config/infrastructure/:infraId/images/:imageIndex/toggle", adminAuth, aboutController.toggleInfraImageActive);

// Pillars CRUD
router.post("/config/pillars", adminAuth, aboutController.addPillar);
router.put("/config/pillars/:pillarId", adminAuth, aboutController.updatePillar);
router.delete("/config/pillars/:pillarId", adminAuth, aboutController.deletePillar);

// Milestones CRUD
router.post("/config/milestones", adminAuth, aboutController.addMilestone);
router.put("/config/milestones/:milestoneId", adminAuth, aboutController.updateMilestone);
router.delete("/config/milestones/:milestoneId", adminAuth, aboutController.deleteMilestone);

module.exports = router;