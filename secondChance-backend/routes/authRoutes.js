const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// The JWT secret from your .env file
const JWT_SECRET = process.env.JWT_SECRET;

// --- EXISTING /register ROUTE ---
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const db = await connectToDatabase();
        const collection = db.collection("users");

        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            logger.error('Registration failed: Email already exists');
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        const newUser = await collection.insertOne({
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        logger.info('User registered successfully');

        res.status(201).json({ authtoken, email });

    } catch (e) {
        logger.error(`Registration error: ${e}`);
        next(e);
    }
});


// ★★★ NEW /login ROUTE ★★★
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. & 2. Connect to DB and access the 'users' collection
        const db = await connectToDatabase();
        const collection = db.collection("users");

        // 3. Check for user credentials in the database
        const theUser = await collection.findOne({ email: email });

        // 7. Send an appropriate message if the user is not found
        if (!theUser) {
            logger.error(`Login attempt for non-existent user: ${email}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // 4. Check if the password matches the encrypted password
        const isMatch = await bcryptjs.compare(password, theUser.password);
        if (!isMatch) {
            logger.error(`Invalid login attempt for user: ${email}`);
            // Use a generic error message for security
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // 5. Fetch user details from the database
        const userName = theUser.firstName;
        const userEmail = theUser.email;
        
        // 6. Create JWT authentication
        const payload = {
            user: {
                id: theUser._id.toString(), // Use the found user's ID
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        
        logger.info(`User logged in successfully: ${email}`);
        
        // Send the final response
        res.json({ authtoken, userName, userEmail });

    } catch (e) {
         logger.error(`Login error: ${e}`);
         next(e);
    }
});


module.exports = router;