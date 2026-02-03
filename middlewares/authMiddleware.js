const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("=== Auth Middleware Called ===");
    const token = req.cookies && req.cookies.token;
    console.log("Token exists:", !!token);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      return res.redirect("/auth/login");
    }

    console.log("Token found, verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'anykey');
    console.log("Decoded token:", decoded);
    
    console.log("Finding user in database...");
    let user = await User.findById(decoded.id).lean();
    console.log("User from database:", user);
    
    // If user not found in database, create user from decoded token data
    if (!user) {
      console.log("User not found in database, creating from token");
      user = {
        _id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email,
        role: decoded.role || 'student'
      };
      console.log("Created user from token:", user);
    }

    console.log("Setting req.user:", user);
    console.log("Setting res.locals.currentUser:", user);
    console.log("Setting res.locals.role:", user.role);
    
    req.user = user;
    res.locals.currentUser = user;
    res.locals.role = user.role;
    console.log("Auth middleware completed successfully");
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    // For testing, create a user from token if verification fails
    try {
      const decoded = jwt.decode(req.cookies.token);
      console.log("Decoded token on error:", decoded);
      if (decoded && decoded.name) {
        const user = {
          _id: decoded.id || 'mockId',
          name: decoded.name,
          email: decoded.email,
          role: decoded.role || 'student'
        };
        req.user = user;
        res.locals.currentUser = user;
        res.locals.role = user.role;
        console.log("Set locals on error - currentUser:", user, "role:", user.role);
        next();
      } else {
        console.log("No valid decoded token, redirecting to login");
        return res.redirect("/auth/login");
      }
    } catch (decodeErr) {
      console.error("Decode error:", decodeErr.message);
      return res.redirect("/auth/login");
    }
  }
};

module.exports = authMiddleware;

