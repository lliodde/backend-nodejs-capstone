// db.js
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;

let dbInstance = null;
const dbName = `${process.env.MONGO_DB}`;

async function connectToDatabase() {
    if (dbInstance){
        return dbInstance
    };

    const client = new MongoClient(url);      

    try {
        // Task 1: Connect to MongoDB
        await client.connect(); // <-- Your code for Task 1
        console.log("Connected successfully to MongoDB server!"); // Optional: Add a log for confirmation

        // Task 2: Connect to database dbName and store in variable dbInstance
        dbInstance = client.db(dbName); // <-- Your code for Task 2
        console.log(`Connected to database: ${dbName}`); // Optional: Add a log

        // Task 3: Return database instance
        return dbInstance; // <-- Your code for Task 3
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        throw err; // Re-throw the error so calling functions know connection failed
    }
}

module.exports = connectToDatabase;
