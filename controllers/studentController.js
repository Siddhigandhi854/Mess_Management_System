const Attendance = require("../models/Attendance");
const Menu = require("../models/Menu");
const Complaint = require("../models/Complaint");
const MessOff = require("../models/MessOff");
const Payment = require("../models/Payment");

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [todayAttendance, complaints, upcomingMessOffs, unpaidBills] = await Promise.all([
      Attendance.findOne({
        student: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      }),
      Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5),
      MessOff.find({
        student: req.user._id,
        startDate: { $gte: new Date() },
      }).sort({ startDate: 1 }).limit(10),
      Payment.find({ student: req.user._id, status: "unpaid" }).sort({ year: -1, month: -1 }).limit(12)
    ]);

    res.render("student/dashboard", {
      title: "Student Dashboard",
      todayAttendance,
      complaints,
      upcomingMessOffs,
      unpaidBills,
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

    const record = await Attendance.findOne({
      student: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.render("student/attendance", {
      title: "Daily Attendance",
      date: date,
      record,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.postAttendance = async (req, res) => {
  try {
    const { status } = req.body;
    const date = new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    console.log("=== Student Post Attendance Debug ===");
    console.log("Status from form:", status);
    console.log("User ID:", req.user._id);
    console.log("Date:", date);
    console.log("Start of day:", startOfDay);
    console.log("End of day:", endOfDay);

    // Check if attendance already exists for today
    const existing = await Attendance.findOne({
      student: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    console.log("Existing attendance:", existing);

    if (existing) {
      // Update existing attendance
      await Attendance.findByIdAndUpdate(existing._id, { status });
      console.log("Updated existing attendance with status:", status);
    } else {
      // Create new attendance record
      const newAttendance = await Attendance.create({
        student: req.user._id,
        date: new Date(),
        status: status || "eating",
      });
      console.log("Created new attendance:", newAttendance);
    }

    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Post attendance error:", err);
    res.redirect("/student/attendance");
  }
};

exports.getMenu = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const todayWeekday = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Get today's menu
    const menus = await Menu.find({
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { weekday: todayWeekday }
      ]
    }).sort({ date: 1, mealType: 1 });

    // Group by meal type
    const menu = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    menus.forEach(menuItem => {
      if (menu[menuItem.mealType.toLowerCase()]) {
        menu[menuItem.mealType.toLowerCase()] = menuItem.items.map(item => item.name);
      }
    });

    // If no menu found, provide default menu
    if (menu.breakfast.length === 0 && menu.lunch.length === 0 && menu.dinner.length === 0) {
      menu.breakfast = ["Poha", "Tea", "Bread"];
      menu.lunch = ["Rice", "Dal", "Sabzi", "Roti"];
      menu.dinner = ["Rice", "Dal", "Sabji", "Roti"];
    }
    
    res.render("student/menu", {
      title: "Menu",
      menu,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Menu error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.render("student/complaints", {
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

exports.postComplaint = async (req, res) => {
  try {
    const { subject, message } = req.body;
    await Complaint.create({
      student: req.user._id,
      subject,
      message,
      status: "open",
    });
    res.redirect("/student/complaints");
  } catch (err) {
    console.error("Post complaint error:", err);
    res.redirect("/student/complaints");
  }
};

exports.getMessOff = async (req, res) => {
  try {
    const messOffs = await MessOff.find({ student: req.user._id }).sort({ startDate: -1 });
    res.render("student/messoff", {
      title: "Mess Off",
      messOffs,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Mess off error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.postMessOff = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    await MessOff.create({
      student: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "pending",
    });
    res.redirect("/student/messoff");
  } catch (err) {
    console.error("Post mess off error:", err);
    res.redirect("/student/messoff");
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id }).sort({ year: -1, month: -1 });
    res.render("student/payments", {
      title: "Payments",
      payments,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Payments error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getSettings = async (req, res) => {
  try {
    // Test settings data - you can create a settings model later
    const settings = {
      notifications: true,
      emailAlerts: true,
      smsAlerts: false,
      language: "english",
      theme: "light"
    };
  
    res.render("student/settings", {
      title: "Settings",
      settings,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};
