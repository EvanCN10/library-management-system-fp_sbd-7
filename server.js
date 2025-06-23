const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Import database connections
const { connectMySQL } = require("./config/mysql")
const { connectMongoDB } = require("./config/mongodb")

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const bookRoutes = require("./routes/books")
const categoryRoutes = require("./routes/categories")
const borrowRoutes = require("./routes/borrowing")
const reportRoutes = require("./routes/reports")
const searchRoutes = require("./routes/search")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, "public")))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/books", bookRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/borrow", borrowRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/search", searchRoutes)

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectMySQL()
    await connectMongoDB()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📱 Frontend: http://localhost:${PORT}`)
      console.log(`🔗 API Base: http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
