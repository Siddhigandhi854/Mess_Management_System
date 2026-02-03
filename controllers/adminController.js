const Payment = require("../models/Payment");
const FoodQuantityConfig = require("../models/FoodQuantityConfig");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const [students, unpaidCount] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Payment.countDocuments({ status: "unpaid" }),
    ]);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      students,
      unpaidCount,
      currentUser: req.user,
      role: req.user.role
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getPayments = async (req, res) => {
  const { month, year } = req.query;
  const filter = {};
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  const payments = await Payment.find(filter)
    .populate("student")
    .sort({ year: -1, month: -1 });

  res.render("admin/payments", {
    title: "Payments",
    payments,
    month,
    year,
  });
};

exports.markPaid = async (req, res) => {
  try {
    await Payment.findByIdAndUpdate(req.params.id, {
      status: "paid",
      paidAt: new Date(),
    });
    res.redirect("/admin/payments");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/payments");
  }
};

exports.getFoodConfig = async (req, res) => {
  const config = await FoodQuantityConfig.findOne();
  res.render("admin/foodConfig", {
    title: "Per-Student Food Config",
    config,
  });
};

exports.postFoodConfig = async (req, res) => {
  try {
    const { ricePerStudentKg, dalPerStudentL, sabjiPerStudentKg, rotiPerStudentCount } = req.body;
    const data = {
      ricePerStudentKg: Number(ricePerStudentKg),
      dalPerStudentL: Number(dalPerStudentL),
      sabjiPerStudentKg: Number(sabjiPerStudentKg),
      rotiPerStudentCount: Number(rotiPerStudentCount) || 0,
    };

    const existing = await FoodQuantityConfig.findOne();
    if (existing) {
      await FoodQuantityConfig.updateOne({}, data);
    } else {
      await FoodQuantityConfig.create(data);
    }

    res.redirect("/admin/food-config");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/food-config");
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render("admin/users", { 
      title: "User Management", 
      users, 
      currentUser: req.user, 
      role: req.user.role 
    });
  } catch (err) {
    console.error("Users error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    // Get real statistics for reports
    const [totalUsers, totalStudents, totalMessStaff, totalAdmins, totalPayments, unpaidPayments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "messKaki" }),
      User.countDocuments({ role: "admin" }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "unpaid" })
    ]);

    const reports = {
      totalUsers,
      totalStudents,
      totalMessStaff,
      totalAdmins,
      totalPayments,
      unpaidPayments
    };

    res.render("admin/reports", { 
      title: "Reports & Analytics", 
      reports,
      currentUser: req.user, 
      role: req.user.role 
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getSettings = async (req, res) => {
  try {
    // Test settings data - you can create a settings model later
    const settings = {
      siteName: "Mess Management System",
      maintenanceMode: false,
      allowRegistration: true,
      defaultMessFee: 3000,
      currency: "INR"
    };
    
    res.render("admin/settings", { 
      title: "System Settings", 
      settings,
      currentUser: req.user, 
      role: req.user.role 
    });
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

exports.getDatabase = async (req, res) => {
  try {
    // Get database statistics
    const [userCount, attendanceCount, menuCount, complaintCount, messOffCount, paymentCount] = await Promise.all([
      User.countDocuments(),
      Attendance.countDocuments(),
      Menu.countDocuments(),
      Complaint.countDocuments(),
      MessOff.countDocuments(),
      Payment.countDocuments()
    ]);

    const dbStats = {
      users: userCount,
      attendance: attendanceCount,
      menus: menuCount,
      complaints: complaintCount,
      messOffs: messOffCount,
      payments: paymentCount
    };

    res.render("admin/database", { 
      title: "Database Management", 
      dbStats,
      currentUser: req.user, 
      role: req.user.role 
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).render("500", { title: "Server Error" });
  }
};

