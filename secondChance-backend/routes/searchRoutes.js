const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for SecondChance items
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        let query = {};

        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
        }

        if (req.query.category) {
            query.category = { $regex: req.query.category, $options: 'i' };
        }

        if (req.query.condition) {
            query.condition = { $regex: req.query.condition, $options: 'i' };
        }

        if (req.query.age_years) {
            query.age_years = { $lte: parseFloat(req.query.age_years) };
        }

        const gifts = await collection.find(query).toArray();

        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
