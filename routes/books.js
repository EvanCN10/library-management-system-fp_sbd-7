const express = require("express")
const { body, validationResult } = require("express-validator")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const router = express.Router()

// Get all books
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query
    const offset = (page - 1) * limit
    const connection = getConnection()

    let query = `
            SELECT b.*, c.name as category_name 
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id 
            WHERE 1=1
        `
    const params = []

    if (category) {
      query += " AND b.category_id = ?"
      params.push(category)
    }

    if (search) {
      query += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += " ORDER BY b.created_at DESC LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [books] = await connection.execute(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM books b WHERE 1=1"
    const countParams = []

    if (category) {
      countQuery += " AND b.category_id = ?"
      countParams.push(category)
    }

    if (search) {
      countQuery += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)"
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const [countResult] = await connection.execute(countQuery, countParams)
    const total = countResult[0].total

    // Log search in MongoDB if search term provided
    if (search) {
      const db = getDB()
      await db.collection("search_logs").insertOne({
        search_term: search,
        results_count: books.length,
        timestamp: new Date(),
        user_id: req.user?.id || null,
      })
    }

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: Number.parseInt(limit),
        },
      },
    })
  } catch (error) {
    console.error("Get books error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    })
  }
})

// Get book by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const connection = getConnection()

    const [books] = await connection.execute(
      `
            SELECT b.*, c.name as category_name 
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id 
            WHERE b.id = ?
        `,
      [id],
    )

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      })
    }

    // Get reviews from MongoDB
    const db = getDB()
    const reviews = await db
      .collection("book_reviews")
      .find({ book_id: Number.parseInt(id) })
      .sort({ created_at: -1 })
      .toArray()

    res.json({
      success: true,
      data: {
        book: books[0],
        reviews,
      },
    })
  } catch (error) {
    console.error("Get book error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    })
  }
})

// Add new book (Admin/Librarian only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "librarian"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("author").notEmpty().withMessage("Author is required"),
    body("total_copies").isInt({ min: 1 }).withMessage("Total copies must be at least 1"),
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

      const { isbn, title, author, publisher, publication_year, category_id, total_copies, location, description } =
        req.body

      const connection = getConnection()

      // Check if ISBN already exists
      if (isbn) {
        const [existingBooks] = await connection.execute("SELECT id FROM books WHERE isbn = ?", [isbn])

        if (existingBooks.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Book with this ISBN already exists",
          })
        }
      }

      const [result] = await connection.execute(
        `
            INSERT INTO books (isbn, title, author, publisher, publication_year, 
                             category_id, total_copies, available_copies, location, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          isbn || null,
          title,
          author,
          publisher || null,
          publication_year || null,
          category_id || null,
          total_copies,
          total_copies,
          location || null,
          description || null,
        ],
      )

      // Log activity in MongoDB
      const db = getDB()
      await db.collection("activity_logs").insertOne({
        user_id: req.user.id,
        action: "book_added",
        details: { book_id: result.insertId, title, author },
        timestamp: new Date(),
      })

      res.status(201).json({
        success: true,
        message: "Book added successfully",
        data: { bookId: result.insertId },
      })
    } catch (error) {
      console.error("Add book error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to add book",
      })
    }
  },
)

// Update book (Admin/Librarian only)
router.put("/:id", authenticateToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { id } = req.params
    const { isbn, title, author, publisher, publication_year, category_id, total_copies, location, description } =
      req.body

    const connection = getConnection()

    // Check if book exists
    const [existingBooks] = await connection.execute("SELECT * FROM books WHERE id = ?", [id])

    if (existingBooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      })
    }

    const currentBook = existingBooks[0]

    // Calculate new available copies
    const copiesDifference = total_copies - currentBook.total_copies
    const newAvailableCopies = currentBook.available_copies + copiesDifference

    if (newAvailableCopies < 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot reduce total copies below borrowed copies",
      })
    }

    await connection.execute(
      `
            UPDATE books SET 
                isbn = ?, title = ?, author = ?, publisher = ?, publication_year = ?,
                category_id = ?, total_copies = ?, available_copies = ?, 
                location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
      [
        isbn || null,
        title,
        author,
        publisher || null,
        publication_year || null,
        category_id || null,
        total_copies,
        newAvailableCopies,
        location || null,
        description || null,
        id,
      ],
    )

    // Log activity in MongoDB
    const db = getDB()
    await db.collection("activity_logs").insertOne({
      user_id: req.user.id,
      action: "book_updated",
      details: { book_id: Number.parseInt(id), title, author },
      timestamp: new Date(),
    })

    res.json({
      success: true,
      message: "Book updated successfully",
    })
  } catch (error) {
    console.error("Update book error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update book",
    })
  }
})

// Delete book (Admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params
    const connection = getConnection()

    // Check if book has active borrowings
    const [activeBorrowings] = await connection.execute(
      'SELECT COUNT(*) as count FROM borrowing_records WHERE book_id = ? AND status = "borrowed"',
      [id],
    )

    if (activeBorrowings[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete book with active borrowings",
      })
    }

    // Get book details for logging
    const [books] = await connection.execute("SELECT title, author FROM books WHERE id = ?", [id])

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      })
    }

    await connection.execute("DELETE FROM books WHERE id = ?", [id])

    // Log activity in MongoDB
    const db = getDB()
    await db.collection("activity_logs").insertOne({
      user_id: req.user.id,
      action: "book_deleted",
      details: { book_id: Number.parseInt(id), title: books[0].title, author: books[0].author },
      timestamp: new Date(),
    })

    res.json({
      success: true,
      message: "Book deleted successfully",
    })
  } catch (error) {
    console.error("Delete book error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    })
  }
})

// Add book review
router.post(
  "/:id/reviews",
  authenticateToken,
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("review").optional().isLength({ max: 1000 }).withMessage("Review must be less than 1000 characters"),
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

      const { id } = req.params
      const { rating, review } = req.body
      const connection = getConnection()

      // Check if book exists
      const [books] = await connection.execute("SELECT id FROM books WHERE id = ?", [id])

      if (books.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        })
      }

      // Check if user has borrowed this book
      const [borrowings] = await connection.execute(
        'SELECT id FROM borrowing_records WHERE user_id = ? AND book_id = ? AND status = "returned"',
        [req.user.id, id],
      )

      if (borrowings.length === 0) {
        return res.status(400).json({
          success: false,
          message: "You can only review books you have borrowed and returned",
        })
      }

      const db = getDB()

      // Check if user already reviewed this book
      const existingReview = await db.collection("book_reviews").findOne({
        book_id: Number.parseInt(id),
        user_id: req.user.id,
      })

      if (existingReview) {
        // Update existing review
        await db.collection("book_reviews").updateOne(
          { book_id: Number.parseInt(id), user_id: req.user.id },
          {
            $set: {
              rating,
              review: review || "",
              updated_at: new Date(),
            },
          },
        )
      } else {
        // Create new review
        await db.collection("book_reviews").insertOne({
          book_id: Number.parseInt(id),
          user_id: req.user.id,
          username: req.user.username,
          rating,
          review: review || "",
          created_at: new Date(),
        })
      }

      res.json({
        success: true,
        message: "Review saved successfully",
      })
    } catch (error) {
      console.error("Add review error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to save review",
      })
    }
  },
)

module.exports = router
