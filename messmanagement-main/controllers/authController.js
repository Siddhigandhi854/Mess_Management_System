const jwt = require("jsonwebtoken");
const User = require("../models/User");



exports.getRegister = (req, res) => {
  res.render("auth/register", { title: "Register", error: null });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render("auth/register", {
        title: "Register",
        error: "Email already registered",
      });
    }
    await User.create({
      name,
      email,
      password,
      role: role || "student",
    });
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.render("auth/register", {
      title: "Register",
      error: "Something went wrong",
    });
  }
};

exports.getLogin = (req, res) => {
  res.render("auth/login", { title: "Login", error: null });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid email or password",
      });
    const token=jwt.sign({
      user._id:._id,
      user.role:role,
      user.email:email,
    },
    'anykey',
    { expiresIn: "7d" }
    );
    res.cookie("token", token,{
      httpOnly:true,
      secure:false,
      maxAge:7*24*60*60*1000,
    });
    return res.redirect("/");
    }

    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (user.role === "student") return res.redirect("/student/dashboard");
    if (user.role === "messKaki") return res.redirect("/mess/dashboard");
    if (user.role === "admin") return res.redirect("/admin/dashboard");

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("auth/login", {
      title: "Login",
      error: "Something went wrong",
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};

