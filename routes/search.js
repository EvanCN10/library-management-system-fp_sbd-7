const express = require("express")
const { getConnection } = require("../config/mysql")
const { getDB } = require("../config/mongodb")

const router = express.Router()

// Advanced search
router.get("/", async (req, res) => {
  try {
    const {
      q, // general search query
      title,
      author,
      isbn,
      category,
      year_from,
      year_to,
      available_only = false,
      page = 1,
      limit = 10,
    } = req.query

    const offset = (page - 1) * limit
    const connection = getConnection()

    let query = `
            SELECT b.*, c.name as category_name 
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id 
            WHERE 1=1
        `
    const params = []

    // General search
    if (q) {
      query += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)"
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    }

    // Specific field searches
    if (title) {
      query += " AND b.title LIKE ?"
      params.push(`%${title}%`)
    }

    if (author) {
      query += " AND b.author LIKE ?"
      params.push(`%${author}%`)
    }

    if (isbn) {
      query += " AND b.isbn LIKE ?"
      params.push(`%${isbn}%`)
    }

    if (category) {
      query += " AND b.category_id = ?"
      params.push(category)
    }

    if (year_from) {
      query += " AND b.publication_year >= ?"
      params.push(year_from)
    }

    if (year_to) {
      query += " AND b.publication_year <= ?"
      params.push(year_to)
    }

    if (available_only === "true") {
      query += " AND b.available_copies > 0"
    }

    query += " ORDER BY b.title LIMIT ? OFFSET ?"
    params.push(Number.parseInt(limit), Number.parseInt(offset))

    const [books] = await connection.execute(query, params)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM books b WHERE 1=1"
    const countParams = []

    if (q) {
      countQuery += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)"
      countParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    }

    if (title) {
      countQuery += " AND b.title LIKE ?"
      countParams.push(`%${title}%`)
    }

    if (author) {
      countQuery += " AND b.author LIKE ?"
      countParams.push(`%${author}%`)
    }

    if (isbn) {
      countQuery += " AND b.isbn LIKE ?"
      countParams.push(`%${isbn}%`)
    }

    if (category) {
      countQuery += " AND b.category_id = ?"
      countParams.push(category)
    }

    if (year_from) {
      countQuery += " AND b.publication_year >= ?"
      countParams.push(year_from)
    }

    if (year_to) {
      countQuery += " AND b.publication_year <= ?"
      countParams.push(year_to)
    }

    if (available_only === "true") {
      countQuery += " AND b.available_copies > 0"
    }

    const [countResult] = await connection.execute(countQuery, countParams)
    const total = countResult[0].total

    // Log search in MongoDB
    const db = getDB()
    await db.collection("search_logs").insertOne({
      search_params: { q, title, author, isbn, category, year_from, year_to, available_only },
      results_count: books.length,
      timestamp: new Date(),
    })

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
    console.error("Search error:", error)
    res.status(500).json({
      success: false,
      message: "Search failed",
    })
  }
})

// Get popular search terms
router.get("/popular-terms", async (req, res) => {
  try {
    const db = getDB()

    const popularTerms = await db
      .collection("search_logs")
      .aggregate([
        { $match: { "search_params.q": { $exists: true, $ne: "" } } },
        { $group: { _id: "$search_params.q", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    res.json({
      success: true,
      data: popularTerms,
    })
  } catch (error) {
    console.error("Get popular terms error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular search terms",
    })
  }
})

module.exports = router
