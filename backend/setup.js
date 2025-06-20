const { executeQuery, getCollection } = require('./config/database');

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Setup MySQL Tables
    console.log('Creating MySQL tables...');
    
    // Books table
    await executeQuery(`
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
    `);

    // Members table
    await executeQuery(`
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
    `);

    // Loans table
    await executeQuery(`
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
    `);

    // Reservations table
    await executeQuery(`
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
    `);

    console.log('MySQL tables created successfully');

    // Setup MongoDB Collections
    console.log('Setting up MongoDB collections...');
    
    const activitiesCollection = await getCollection('activities');
    await activitiesCollection.createIndex({ createdAt: -1 });

    const logsCollection = await getCollection('logs');
    await logsCollection.createIndex({ timestamp: -1 });

    console.log('MongoDB collections setup successfully');

    // Insert sample data
    console.log('Inserting sample data...');
    await insertSampleData();

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

async function insertSampleData() {
  const { v4: uuidv4 } = require('uuid');

  // Sample books
  const books = [
    {
      id: uuidv4(),
      title: 'Pemrograman Modern',
      author: 'John Doe',
      isbn: '978-123456789',
      publisher: 'Tech Publisher',
      category: 'Teknologi',
      year: 2024,
      copies: 5,
      available: 3,
      description: 'Buku tentang pemrograman modern'
    },
    {
      id: uuidv4(),
      title: 'Algoritma dan Struktur Data',
      author: 'Jane Smith',
      isbn: '978-987654321',
      publisher: 'CS Publisher',
      category: 'Teknologi',
      year: 2023,
      copies: 3,
      available: 1,
      description: 'Panduan lengkap algoritma dan struktur data'
    },
    {
      id: uuidv4(),
      title: 'Database Management',
      author: 'Bob Wilson',
      isbn: '978-456789123',
      publisher: 'DB Publisher',
      category: 'Teknologi',
      year: 2023,
      copies: 4,
      available: 4,
      description: 'Manajemen database modern'
    }
  ];

  for (const book of books) {
    await executeQuery(
      `INSERT IGNORE INTO books (id, title, author, isbn, publisher, category, year, copies, available, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [book.id, book.title, book.author, book.isbn, book.publisher, book.category, book.year, book.copies, book.available, book.description]
    );
  }

  // Sample members
  const members = [
    {
      id: uuidv4(),
      name: 'Budi Santoso',
      email: 'budi@email.com',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 1'
    },
    {
      id: uuidv4(),
      name: 'Siti Nurhaliza',
      email: 'siti@email.com',
      phone: '081234567891',
      address: 'Jl. Sudirman No. 2'
    }
  ];

  for (const member of members) {
    await executeQuery(
      `INSERT IGNORE INTO members (id, name, email, phone, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [member.id, member.name, member.email, member.phone, member.address]
    );
  }

  // Sample activities in MongoDB
  const activitiesCollection = await getCollection('activities');
  const activities = [
    {
      id: uuidv4(),
      action: 'add_book',
      description: 'Buku "Pemrograman Modern" ditambahkan',
      entityType: 'book',
      createdAt: new Date()
    },
    {
      id: uuidv4(),
      action: 'add_member',
      description: 'Anggota "Budi Santoso" terdaftar',
      entityType: 'member',
      createdAt: new Date()
    }
  ];

  await activitiesCollection.insertMany(activities);
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };