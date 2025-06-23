const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")

const router = express.Router()

// Register
router.post(
  "/register",
  [
    body("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("full_name").notEmpty().withMessage("Full name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { username, email, password, full_name, phone, address } = req.body
      const connection = getConnection()

      // Check if user already exists
      const [existingUsers] = await connection.execute("SELECT id FROM users WHERE username = ? OR email = ?", [
        username,
        email,
      ])

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Insert user
      const [result] = await connection.execute(
        "INSERT INTO users (username, email, password, full_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
        [username, email, hashedPassword, full_name, phone || null, address || null],
      )

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: result.insertId,
        action: "user_registered",
        details: { username, email },
        timestamp: new Date(),
      })

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { userId: result.insertId },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Registration failed",
      })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { username, password } = req.body
      const connection = getConnection()

      // Get user
      const [users] = await connection.execute(
        "SELECT id, username, email, password, role, status FROM users WHERE username = ? OR email = ?",
        [username, username],
      )

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      const user = users[0]

      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "Account is not active",
        })
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      })

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: user.id,
        action: "user_login",
        details: { username: user.username },
        timestamp: new Date(),
      })

      res.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Login failed",
      })
    }
  },
)

module.exports = router