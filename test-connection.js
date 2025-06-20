const { connectMySQL, getConnection } = require('./config/mysql')
const { connectMongoDB, getDB } = require('./config/mongodb')

async function testConnections() {
    console.log('🔍 Testing Database Connections...\n')
    
    // Test MySQL
    try {
        await connectMySQL()
        const connection = getConnection()
        const [result] = await connection.execute('SELECT 1 as test')
        console.log('✅ MySQL: Connected successfully')
        console.log(`   Test query result: ${result[0].test}`)
    } catch (error) {
        console.log('❌ MySQL: Connection failed')
        console.log(`   Error: ${error.message}`)
    }
    
    // Test MongoDB
    try {
        const db = await connectMongoDB()
        await db.admin().ping()
        console.log('✅ MongoDB: Connected successfully')
        console.log(`   Database: ${db.databaseName}`)
    } catch (error) {
        console.log('❌ MongoDB: Connection failed')
        console.log(`   Error: ${error.message}`)
    }
}

// Load environment variables
require('dotenv').config()
testConnections()