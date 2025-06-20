const express = require("express")
const { body, validationResult } = require("express-validator")
const { getConnection } = require("../config/mysql")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Get all categories
router.get("/", async (req, res) => {
  try {
    const connection = getConnection()
    const [categories] = await connection.execute(`
            SELECT c.*, COUNT(b.id) as book_count
            FROM categories c
            LEFT JOIN books b ON c.id = b.category_id
            GROUP BY c.id
            ORDER BY c.name
        `)

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    })
  }
})

// Add new category (Admin/Librarian only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "librarian"),
  [body("name").notEmpty().withMessage("Category name is required")],
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

      const { name, description } = req.body
      const connection = getConnection()

      // Check if category already exists
      const [existingCategories] = await connection.execute("SELECT id FROM categories WHERE name = ?", [name])

      if (existingCategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        })
      }

      const [result] = await connection.execute("INSERT INTO categories (name, description) VALUES (?, ?)", [
        name,
        description || null,
      ])

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { categoryId: result.insertId },
      })
    } catch (error) {
      console.error("Add category error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create category",
      })
    }
  },
)

// Update category (Admin/Librarian only)
router.put("/:id", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const connection = getConnection()

    // Check if category exists
    const [existingCategories] = await connection.execute("SELECT id FROM categories WHERE id = ?", [id])

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    await connection.execute("UPDATE categories SET name = ?, description = ? WHERE id = ?", [
      name,
      description || null,
      id,
    ])

    res.json({
      success: true,
      message: "Category updated successfully",
    })
  } catch (error) {
    console.error("Update category error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    })
  }
})

// Delete category (Admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params
    const connection = getConnection()

    // Check if category has books
    const [books] = await connection.execute("SELECT COUNT(*) as count FROM books WHERE category_id = ?", [id])

    if (books[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category that has books assigned to it",
      })
    }

    const [result] = await connection.execute("DELETE FROM categories WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    })
  }
})

module.exports = router
