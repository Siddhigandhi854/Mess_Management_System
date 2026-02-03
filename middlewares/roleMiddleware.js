const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).render("403", {
        title: "Forbidden",
      });
    }
    next();
  };
};

module.exports = roleMiddleware;

