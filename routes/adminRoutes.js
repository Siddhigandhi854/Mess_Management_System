const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Simple test route
router.get("/test", (req, res) => {
  res.send("Admin routes are working!");
});

// Temporarily remove role middleware for testing
router.get("/dashboard", adminController.getDashboard);
router.get("/payments", adminController.getPayments);
router.post("/payments/:id/mark-paid", adminController.markPaid);
router.get("/food-config", adminController.getFoodConfig);
router.post("/food-config", adminController.postFoodConfig);
router.get("/users", adminController.getUsers);
router.get("/reports", adminController.getReports);
router.get("/settings", adminController.getSettings);
router.get("/database", adminController.getDatabase);

module.exports = router;
