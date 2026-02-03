const Attendance = require("../models/Attendance");
const Menu = require("../models/Menu");
const Complaint = require("../models/Complaint");
const MessOff = require("../models/MessOff");
const FoodQuantityConfig = require("../models/FoodQuantityConfig");
const Payment = require("../models/Payment");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    console.log("=== Mess Dashboard Attendance Debug ===");
    console.log("Today:", today);
    console.log("Start of day:", startOfDay);
    console.log("End of day:", endOfDay);

    // First, let's see all attendance records for today
    const allAttendanceToday = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('student');
    
    console.log("All attendance records for today:", allAttendanceToday);

    const [todayCount, upcomingMessOffs, complaints, unpaidBills, totalStudents] = await Promise.all([
      Attendance.countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay }
      }), // Count all attendance records for today, not just "eating"
      MessOff.find({ 
        startDate: { $gte: startOfDay } 
      })
        .populate("student")
        .sort({ startDate: 1 })
        .limit(10),
      Complaint.find({ status: "open" })
        .populate("student")
        .sort({ createdAt: -1 })
        .limit(5),
      Payment.find({ status: "unpaid" })
        .populate("student")
        .sort({ createdAt: -1 })
        .limit(10),
      User.countDocuments({ role: "student" })
    ]);

    console.log("Today's attendance count (all records):", todayCount);
    console.log("Total students:", totalStudents);

    res.render("mess/dashboard", {
      title: "Mess Kaki Dashboard",
      todayCount,
      upcomingMessOffs,
      complaints,
      unpaidBills,
      totalStudents,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "eating",
    });

    res.render("mess/attendance", { 
      title: "Attendance", 
      date: date, 
      count,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ date: 1, weekday: 1 });
    res.render("mess/menu", {
      title: "Manage Menu",
      menus,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Menu error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.postMenu = async (req, res) => {
  try {
    const { date, weekday, mealType, items } = req.body;
    const itemsArray = items
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    await Menu.create({
      date: date || undefined,
      weekday: weekday || undefined,
      mealType,
      items: itemsArray,
    });
    res.redirect("/mess/menu");
  } catch (err) {
    console.error("Menu error:", err);
    res.redirect("/mess/menu");
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.redirect("/mess/menu");
  } catch (err) {
    console.error("Delete menu error:", err);
    res.redirect("/mess/menu");
  }
};

exports.getFoodCalculator = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const [count, config] = await Promise.all([
      Attendance.countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "eating",
      }),
      FoodQuantityConfig.findOne(),
    ]);

    res.render("mess/foodCalculator", {
      title: "Food Calculator",
      date,
      count,
      config,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Food calculator error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({}).populate('student').sort({ createdAt: -1 });
    res.render("mess/complaints", { 
      title: "Complaints", 
      complaints,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Complaints error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, {
      status: "resolved",
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    });
    res.redirect("/mess/complaints");
  } catch (err) {
    console.error("Resolve complaint error:", err);
    res.redirect("/mess/complaints");
  }
};

exports.getPayments = async (req, res) => {
  try {
    const unpaidBills = await Payment.find({ status: "unpaid" }).populate('student').sort({ year: -1, month: -1 });
    res.render("mess/payments", { 
      title: "Payments", 
      unpaidBills,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Payments error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.markPaymentPaid = async (req, res) => {
  try {
    await Payment.findByIdAndUpdate(req.params.id, {
      status: "paid",
      paidAt: new Date(),
    });
    res.redirect("/mess/payments");
  } catch (err) {
    console.error("Mark payment paid error:", err);
    res.redirect("/mess/payments");
  }
};

exports.getMessOff = async (req, res) => {
  try {
    const upcomingMessOffs = await MessOff.find({}).populate('student').sort({ startDate: -1 });
    res.render("mess/messoff", { 
      title: "Mess Off", 
      upcomingMessOffs,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Mess off error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.approveMessOff = async (req, res) => {
  try {
    await MessOff.findByIdAndUpdate(req.params.id, {
      status: "approved",
      approvedBy: req.user._id,
    });
    res.redirect("/mess/messoff");
  } catch (err) {
    console.error("Approve mess off error:", err);
    res.redirect("/mess/messoff");
  }
};
