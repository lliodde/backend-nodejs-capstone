const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e);
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        let secondChanceItem = req.body;

        const lastItem = await collection.findOne({}, { sort: { id: -1 } });
        // Ensure new IDs are also strings to be consistent
        secondChanceItem.id = lastItem ? (parseInt(lastItem.id) + 1).toString() : "1";
        
        if (req.file) {
            secondChanceItem.image = '/images/' + req.file.originalname;
        } else {
            secondChanceItem.image = '/images/placeholder.png';
        }

        const result = await collection.insertOne(secondChanceItem);
        const insertedItem = await collection.findOne({ _id: result.insertedId });
        res.status(201).json(insertedItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        // ★★★ FIX: ID is a string in the database, so we do NOT parse it. ★★★
        const id = req.params.id;

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems"); 
        const secondChanceItem = await collection.findOne({ id: id });
        
        if (!secondChanceItem) {
            return res.status(404).send("secondChanceItem not found");
        }
        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', async(req, res, next) => {
    try {
        // ★★★ FIX: ID is a string, do not parse. ★★★
        const id = req.params.id;

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        
        if (updateData.age_days !== undefined) {
            updateData.age_years = Number((updateData.age_days / 365).toFixed(1));
        }
        updateData.updatedAt = new Date();

        const updateResult = await collection.findOneAndUpdate(
            { id: id },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        
        if (!updateResult || !updateResult.value) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }
        res.json(updateResult.value);
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        // ★★★ FIX: ID is a string, do not parse. ★★★
        const id = req.params.id;

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const deleteResult = await collection.deleteOne({ id: id });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }
        res.status(200).json({"deleted":"success"});
    } catch (e) {
        next(e);
    }
});

module.exports = router;
