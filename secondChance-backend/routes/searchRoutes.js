const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for items
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        // Initialize the query object
        let query = {};

        // ★★★ THE FINAL FIX ★★★
        // This uses a more robust syntax for the case-insensitive name search.
        if (req.query.name && req.query.name.trim() !== '') {
            query.name = new RegExp(req.query.name, 'i');
        }

        // Add other filters to the query
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition; 
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }

        const gifts = await collection.find(query).toArray();

        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
