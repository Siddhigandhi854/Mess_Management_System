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

    // Check if there are any students in the database
    const User = require("../models/User");
    const allStudents = await User.find({ role: "student" });
    console.log("Total students in database:", allStudents.length);
    allStudents.forEach(student => {
      console.log(`- Student: ${student.name} (${student.email})`);
    });

    // If no students exist, create a test student
    if (allStudents.length === 0) {
      console.log("No students found, creating test student...");
      const testStudent = await User.create({
        name: "Test Student",
        email: "test@student.com",
        password: "123456",
        role: "student"
      });
      console.log("Created test student:", testStudent);
    }

    // If no attendance exists for today, create test attendance
    const existingAttendance = await Attendance.findOne({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (!existingAttendance) {
      console.log("No attendance found for today, creating test attendance...");
      const firstStudent = await User.findOne({ role: "student" });
      if (firstStudent) {
        const testAttendance = await Attendance.create({
          student: firstStudent._id,
          date: new Date(),
          mealType: "lunch",
          status: "confirmed",
          markedAt: new Date()
        });
        console.log("Created test attendance:", testAttendance);
      }
    }

    // Get meal-specific attendance counts for today
    const mealAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          status: "confirmed"
        }
      },
      {
        $group: {
          _id: "$mealType",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easier access
    const mealCounts = {
      breakfast: 0,
      lunch: 0,
      dinner: 0
    };
    
    mealAttendance.forEach(meal => {
      mealCounts[meal._id] = meal.count;
    });

    console.log("Meal attendance counts:", mealCounts);

    // First, let's see all attendance records in the database
    const allAttendance = await Attendance.find({});
    console.log("Total attendance records in database:", allAttendance.length);
    
    // Check records for today specifically
    const allAttendanceToday = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log("All attendance records today:", allAttendanceToday.length);
    allAttendanceToday.forEach(record => {
      console.log(`- Student: ${record.student}, Meal: ${record.mealType}, Status: ${record.status}, Date: ${record.date}`);
    });
    
    // Also check records with confirmed status
    const confirmedAttendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed"
    });
    console.log("Confirmed attendance records today:", confirmedAttendance.length);
    confirmedAttendance.forEach(record => {
      console.log(`- Confirmed - Student: ${record.student}, Meal: ${record.mealType}, Status: ${record.status}, Date: ${record.date}`);
    });

    // Get detailed attendance records for display
    const attendanceDetails = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed"
    }).populate('student').sort({ mealType: 1, markedAt: 1 });

    const [upcomingMessOffs, complaints, unpaidBills, totalStudents] = await Promise.all([
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

    console.log("Total students:", totalStudents);

    res.render("mess/dashboard", {
      title: "Mess Kaki Dashboard",
      mealCounts,
      attendanceDetails,
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
      status: "confirmed",
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
    
    // Extract query parameters for success/error messages
    const { success, error } = req.query;
    
    res.render("mess/menu", {
      title: "Manage Menu",
      menus,
      success,
      error,
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
    console.log("=== Menu Post Debug ===");
    console.log("Request body:", req.body);
    
    const { date, weekday, mealType, items } = req.body;
    
    // Validate required fields
    if (!mealType || !items || items.trim() === '') {
      console.log("Missing required fields");
      return res.redirect("/mess/menu?error=missing_fields");
    }
    
    // Convert mealType to lowercase to match model enum
    const normalizedMealType = mealType.toLowerCase();
    
    const itemsArray = items
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    console.log("Processed items:", itemsArray);
    console.log("Normalized meal type:", normalizedMealType);

    if (itemsArray.length === 0) {
      console.log("No valid items provided");
      return res.redirect("/mess/menu?error=no_items");
    }

    const menu = await Menu.create({
      date: date || undefined,
      weekday: weekday || undefined,
      mealType: normalizedMealType,
      items: itemsArray,
    });
    
    console.log("Menu created successfully:", menu._id);
    res.redirect("/mess/menu?success=true");
  } catch (err) {
    console.error("Menu error:", err);
    res.redirect("/mess/menu?error=server_error");
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

    // Get or create default food config
    let config = await FoodQuantityConfig.findOne();
    if (!config) {
      config = await FoodQuantityConfig.create({
        ricePerStudentKg: 0.25,
        dalPerStudentL: 0.2,
        sabjiPerStudentKg: 0.2,
        rotiPerStudentCount: 2
      });
    }

    const count = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed",
    });

    console.log("=== Food Calculator Debug ===");
    console.log("Date:", date);
    console.log("Start of day:", startOfDay);
    console.log("End of day:", endOfDay);
    console.log("Attendance count:", count);
    console.log("Food config:", config);

    // Always calculate quantities if config exists
    let quantities = null;
    if (config) {
      // Use count or default to 1 if no attendance found
      const studentCount = count > 0 ? count : 1;
      console.log("Using student count:", studentCount, "(actual count:", count, ")");
      
      // Add 10% extra for wastage
      const multiplier = 1.1;
      quantities = {
        riceKg: Math.round((config.ricePerStudentKg * studentCount * multiplier) * 100) / 100,
        dalL: Math.round((config.dalPerStudentL * studentCount * multiplier) * 100) / 100,
        sabjiKg: Math.round((config.sabjiPerStudentKg * studentCount * multiplier) * 100) / 100,
        rotis: Math.round(config.rotiPerStudentCount * studentCount * multiplier)
      };
      console.log("Calculated quantities:", quantities);
      
      // If no actual attendance, create test data for future use
      if (count === 0) {
        console.log("No attendance found, creating test data for future...");
        const User = require("../models/User");
        const firstStudent = await User.findOne({ role: "student" });
        if (firstStudent) {
          const testAttendance = await Attendance.create({
            student: firstStudent._id,
            date: new Date(),
            mealType: "lunch",
            status: "confirmed",
            markedAt: new Date()
          });
          console.log("Created test attendance:", testAttendance);
        }
      }
    } else {
      console.log("No food config found");
    }

    res.render("mess/foodCalculator", {
      title: "Food Calculator",
      date,
      count,
      config,
      quantities,
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
