// src/middleware/auth.js
const jwt = require("jsonwebtoken");

exports.verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // must be lowercase 'authorization'
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // attach admin info to req
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
