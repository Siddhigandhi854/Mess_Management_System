const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://siddhigandhi53_db_user:qZpyD6T1KMW0BrJ5@cluster0.jad29vq.mongodb.net/MessData?appName=Cluster0";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.log("⚠️  Running without MongoDB - some features may not work");
  });

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static("public"));

// View Engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Auth Middleware & User Locals
const authMiddleware = require("./middlewares/authMiddleware");
app.use((req, res, next) => {
  res.locals.currentUser = null;
  res.locals.role = null;
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const messRoutes = require("./routes/messRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

app.use("/auth", authRoutes);
// Add auth middleware back to student and mess routes for testing
app.use("/student", authMiddleware, studentRoutes);
app.use("/mess", authMiddleware, messRoutes);
// Temporarily remove auth middleware for admin routes testing
app.use("/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", { title: "Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
