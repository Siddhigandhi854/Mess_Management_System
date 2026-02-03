const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const messController = require("../controllers/messController");

const router = express.Router();

// Temporarily remove role middleware for testing
router.get("/dashboard", messController.getDashboard);
router.get("/attendance", messController.getAttendance);
router.get("/menu", messController.getMenu);
router.post("/menu", messController.postMenu);
router.get("/menu/:id/delete", messController.deleteMenu);
router.get("/food-calculator", messController.getFoodCalculator);
router.get("/complaints", messController.getComplaints);
router.post("/complaints/:id/resolve", messController.resolveComplaint);
router.get("/payments", messController.getPayments);
router.post("/payments/:id/mark-paid", messController.markPaymentPaid);
router.get("/messoff", messController.getMessOff);
router.post("/messoff/:id/approve", messController.approveMessOff);

module.exports = router;
