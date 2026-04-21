const Attendance = require("../models/Attendance");
const MealTiming = require("../models/MealTiming");
const Menu = require("../models/Menu");
const Complaint = require("../models/Complaint");
const MessOff = require("../models/MessOff");
const Payment = require("../models/Payment");

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const todayWeekday = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Get today's menu
    console.log("=== Student Dashboard Menu Debug ===");
    console.log("Today:", today);
    console.log("Weekday:", todayWeekday);
    console.log("Start of day:", startOfDay);
    console.log("End of day:", endOfDay);

    const menus = await Menu.find({
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { weekday: todayWeekday }
      ]
    }).sort({ date: 1, mealType: 1 });

    console.log("Found menus:", menus.length);
    menus.forEach(menu => {
      console.log("Meal:", menu.mealType, "Items:", menu.items.map(item => item.name).join(', '));
    });

    // Group by meal type
    const todaysMenu = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    menus.forEach(menuItem => {
      if (todaysMenu[menuItem.mealType.toLowerCase()]) {
        todaysMenu[menuItem.mealType.toLowerCase()] = menuItem.items.map(item => item.name);
      }
    });

    console.log("Final todaysMenu:", todaysMenu);

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
      todaysMenu,
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
    const currentTime = new Date();

    // Get meal timings
    const mealTimings = await MealTiming.find({ isActive: true }).sort({ mealType: 1 });
    
    // Get student's meal attendance for today
    const attendanceRecords = await Attendance.find({
      student: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ mealType: 1 });

    // Check which meals are still available for marking
    const mealStatus = {};
    mealTimings.forEach(timing => {
      const [hours, minutes] = timing.cutoffTime.split(':').map(Number);
      const cutoffTime = new Date();
      cutoffTime.setHours(hours, minutes, 0, 0);
      
      mealStatus[timing.mealType] = {
        canMark: currentTime < cutoffTime,
        cutoffTime: timing.cutoffTime,
        mealTime: `${timing.mealStartTime} - ${timing.mealEndTime}`,
        marked: attendanceRecords.find(record => record.mealType === timing.mealType)
      };
    });

    res.render("student/attendance", {
      title: "Meal Attendance",
      date: date,
      mealTimings,
      mealStatus,
      attendanceRecords,
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
    const { mealType, status } = req.body;
    const date = new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const currentTime = new Date();

    console.log("=== Student Post Attendance Debug ===");
    console.log("Meal Type:", mealType);
    console.log("Status:", status);
    console.log("User ID:", req.user._id);
    console.log("Current Time:", currentTime);

    // Get meal timing to check cutoff time
    const mealTiming = await MealTiming.findOne({ mealType, isActive: true });
    if (!mealTiming) {
      console.log("Meal timing not found for:", mealType);
      return res.redirect("/student/attendance?error=meal_not_found");
    }

    // Check if current time is before cutoff time
    const [hours, minutes] = mealTiming.cutoffTime.split(':').map(Number);
    const cutoffTime = new Date();
    cutoffTime.setHours(hours, minutes, 0, 0);

    if (currentTime >= cutoffTime) {
      console.log("Cutoff time passed for:", mealType);
      return res.redirect(`/student/attendance?error=cutoff_passed&meal=${mealType}`);
    }

    // Check if attendance already exists for this meal today
    const existing = await Attendance.findOne({
      student: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      mealType: mealType,
    });

    if (existing) {
      // Update existing attendance
      await Attendance.findByIdAndUpdate(existing._id, { 
        status: status || "confirmed",
        markedAt: new Date()
      });
      console.log("Updated existing attendance for meal:", mealType);
    } else {
      // Create new attendance record
      const newAttendance = await Attendance.create({
        student: req.user._id,
        date: new Date(),
        mealType: mealType,
        status: status || "confirmed",
        markedAt: new Date(),
      });
      console.log("Created new attendance for meal:", mealType);
    }

    res.redirect("/student/attendance?success=true");
  } catch (err) {
    console.error("Post attendance error:", err);
    res.redirect("/student/attendance?error=server_error");
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
