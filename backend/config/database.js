const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MySQL Connection Pool
let mysqlPool = null;

const getMySQLPool = () => {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'lms7',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return mysqlPool;
};

// MongoDB Connection
let mongoClient = null;
let mongoDb = null;

const connectMongoDB = async () => {
  if (mongoClient && mongoDb) {
    return { client: mongoClient, db: mongoDb };
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'lms7';

    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);

    console.log('Connected to MongoDB successfully');
    return { client: mongoClient, db: mongoDb };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Execute MySQL Query
const executeQuery = async (sql, params = []) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL query error:', error);
    throw new Error('Database query failed');
  }
};

// Get MongoDB Collection
const getCollection = async (collectionName) => {
  const { db } = await connectMongoDB();
  return db.collection(collectionName);
};

module.exports = {
  getMySQLPool,
  connectMongoDB,
  executeQuery,
  getCollection
};