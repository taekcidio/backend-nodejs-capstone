const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');

// Register user
router.post('/register', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        const { username, password } = req.body;

        const existingUser = await collection.findOne({ username });

        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await collection.insertOne({
            username,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertedId
        });
    } catch (e) {
        next(e);
    }
});

// Login user
router.post('/login', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        const { username, password } = req.body;

        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { username: user.username },
            process.env.JWT_SECRET || 'setasecret',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token
        });
    } catch (e) {
        next(e);
    }
});

// Update user
router.put('/update', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        const { username, ...updates } = req.body;

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const result = await collection.updateOne(
            { username },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
