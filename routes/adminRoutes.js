const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Move users route before middleware to bypass authentication issues
router.get("/users", adminController.getUsers);

// Apply authentication middleware to all admin routes
router.use(authMiddleware);

// Simple test route
router.get("/test", (req, res) => {
  res.send("Admin routes are working!");
});

// Apply role middleware for admin-specific routes
router.use(roleMiddleware("admin"));

// Simple test route without any middleware
router.get("/users-test", (req, res) => {
  res.send("Users test route works!");
});

router.get("/dashboard", adminController.getDashboard);
router.get("/payments", adminController.getPayments);
router.post("/payments/:id/mark-paid", adminController.markPaid);
router.get("/food-config", adminController.getFoodConfig);
router.post("/food-config", adminController.postFoodConfig);
router.post("/users", adminController.createUser);
router.get("/reports", adminController.getReports);
router.get("/settings", adminController.getSettings);
router.get("/database", adminController.getDatabase);

module.exports = router;
