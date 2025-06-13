import { MongoClient, type Db } from "mongodb"

let client: MongoClient | null = null
let db: Db | null = null

export const connectToMongoDB = async () => {
  if (client && db) {
    return { client, db }
  }

  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
    const dbName = process.env.MONGODB_DB || "lms7"

    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)

    console.log("Connected to MongoDB successfully")
    return { client, db }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw error
  }
}

export const getCollection = async (collectionName: string) => {
  const { db } = await connectToMongoDB()
  return db.collection(collectionName)
}

// Initialize MongoDB collections and indexes
export const initializeCollections = async () => {
  try {
    const { db } = await connectToMongoDB()

    // Create activities collection
    await db.createCollection("activities")
    await db.collection("activities").createIndex({ createdAt: -1 })

    // Create logs collection for audit trail
    await db.createCollection("logs")
    await db.collection("logs").createIndex({ timestamp: -1 })
    await db.collection("logs").createIndex({ entityType: 1 })
    await db.collection("logs").createIndex({ action: 1 })

    // Create reports collection for cached reports
    await db.createCollection("reports")

    console.log("MongoDB collections initialized successfully")
  } catch (error) {
    console.error("Failed to initialize MongoDB collections:", error)
    throw error
  }
}
