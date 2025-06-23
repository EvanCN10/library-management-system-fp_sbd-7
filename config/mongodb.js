const { MongoClient } = require("mongodb")

let db
let client

const connectMongoDB = async () => {
  try {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()

    db = client.db()
    console.log("✅ Connected to MongoDB database")
    await createCollections()
    return db
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)
    throw error
  }
}

const createCollections = async () => {
  try {
    const collections = [
      "book_reviews",
      "search_logs",
      "activity_logs",
      "user_preferences",
      "notifications",
      "book_recommendations",
    ]

    for (const collectionName of collections) {
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext()
      if (!collectionExists) {
        await db.createCollection(collectionName)
      }
    }

    // Create indexes
    await db.collection("book_reviews").createIndex({ book_id: 1, user_id: 1 })
    await db.collection("search_logs").createIndex({ timestamp: -1 })
    await db.collection("activity_logs").createIndex({ user_id: 1, timestamp: -1 })
    await db.collection("notifications").createIndex({ user_id: 1, created_at: -1 })

    console.log("✅ MongoDB collections and indexes created successfully")
  } catch (error) {
    console.error("❌ Error creating MongoDB collections:", error)
    throw error
  }
}

const getDB = () => {
  if (!db) {
    throw new Error("MongoDB connection not established")
  }
  return db
}

module.exports = { connectMongoDB, getDB }
