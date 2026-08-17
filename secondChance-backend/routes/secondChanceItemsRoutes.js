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
    const collection = db.collection('secondChanceItems');
    const secondChanceItems = await collection.find({}).toArray();
    res.json(secondChanceItems);
  } catch (e) {
    console.error('oops something went wrong', e);
    next(e);
  }
});

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    const itemData = JSON.parse(req.body.item || '{}');

    if (req.file) {
      itemData.image = `/images/${req.file.filename}`;
    }

    const result = await collection.insertOne(itemData);

    res.status(201).json({
      ...itemData,
      _id: result.insertedId
    });
  } catch (e) {
    next(e);
  }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    const item = await collection.findOne({ id: req.params.id });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Update an existing item
router.put('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (e) {
    next(e);
  }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    const result = await collection.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
