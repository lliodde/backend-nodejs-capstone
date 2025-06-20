const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// The JWT secret from your .env file
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res, next) => {
    try {
        // Get user details from request body
        const { email, password, firstName, lastName } = req.body;

        // 1. Connect to the database
        const db = await connectToDatabase();

        // 2. Access the 'users' collection
        const collection = db.collection("users");

        // 3. Check if user already exists
        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            logger.error('Registration failed: Email already exists');
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // 4. Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        // 5. Insert the new user into the database
        const newUser = await collection.insertOne({
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: hash,
            createdAt: new Date(),
        });

        // 6. Create JWT payload and sign the token
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // 7. Log the successful registration
        logger.info('User registered successfully');

        // 8. Return the token and user email
        // Note: 201 Created is the appropriate status code
        res.status(201).json({ authtoken, email });

    } catch (e) {
         logger.error(`Registration error: ${e}`);
         next(e); // Pass error to the global error handler
    }
});

module.exports = router;