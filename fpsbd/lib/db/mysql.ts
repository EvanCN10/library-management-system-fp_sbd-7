import mysql from "mysql2/promise"

// MySQL connection pool
let pool: mysql.Pool | null = null

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "lms7",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

// Execute a query with parameters\
export const query = async <T>(sql: string, params?: any[])
: Promise<T> =>
{
  try {
    const pool = getPool()
    const [rows] = await pool.execute(sql, params)
    return rows as T
  } catch (error) {
    console.error("MySQL query error:", error)
    throw new Error("Database query failed")
  }
}

// Initialize database tables if they don't exist
export const initializeDatabase = async () => {
  try {
    // Create books table
    await query(`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20) NOT NULL UNIQUE,
        publisher VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        year INT NOT NULL,
        copies INT NOT NULL DEFAULT 1,
        available INT NOT NULL DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create members table
    await query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create loans table
    await query(`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(36) PRIMARY KEY,
        member_id VARCHAR(36) NOT NULL,
        book_id VARCHAR(36) NOT NULL,
        borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        return_date TIMESTAMP NULL,
        status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
        fine DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      )
    `)

    // Create reservations table
    await query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id VARCHAR(36) PRIMARY KEY,
        member_id VARCHAR(36) NOT NULL,
        book_id VARCHAR(36) NOT NULL,
        reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'fulfilled', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      )
    `)

    console.log("MySQL database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error)
    throw error
  }
}