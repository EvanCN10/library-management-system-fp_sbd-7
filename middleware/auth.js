const jwt = require("jsonwebtoken")
const { getConnection } = require("../config/mysql")

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from database
    const connection = getConnection()
    const [users] = await connection.execute("SELECT id, username, email, role, status FROM users WHERE id = ?", [
      decoded.userId,
    ])

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      })
    }

    if (users[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      })
    }

    req.user = users[0]
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      })
    }
    next()
  }
}

module.exports = { authenticateToken, authorizeRoles }
