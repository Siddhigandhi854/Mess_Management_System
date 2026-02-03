const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

// Temporarily remove role middleware for testing
router.get("/dashboard", studentController.getDashboard);
router.get("/attendance", studentController.getAttendance);
router.post("/attendance", studentController.postAttendance);
router.get("/menu", studentController.getMenu);
router.get("/complaints", studentController.getComplaints);
router.post("/complaints", studentController.postComplaint);
router.get("/messoff", studentController.getMessOff);
router.post("/messoff", studentController.postMessOff);
router.get("/payments", studentController.getPayments);
router.get("/settings", studentController.getSettings);

module.exports = router;
