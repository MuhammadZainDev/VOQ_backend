// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Load environment variables
require('dotenv').config();

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, number, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            number,
            password: hashedPassword,
        });

        await user.save();

        // Initialize session
        req.session.user = {
            id: user.id,
            role: user.role, // 'USER' or 'ADMIN'
        };

        // Save session before sending response
        req.session.save(err => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Session save failed' });
            }
            res.json({ msg: 'User registered successfully' });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Initialize session with user role from database
        req.session.user = {
            id: user.id,
            role: user.role, // 'USER' or 'ADMIN'
        };

        // Save session before sending response
        req.session.save(err => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Session save failed' });
            }
            res.json({ msg: 'User logged in successfully', role: user.role });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ msg: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ msg: 'Logged out successfully' });
    });
});

// Get Current User
router.get('/current-user', authMiddleware, (req, res) => {
    res.json({ user: req.session.user });
});

// Protected Route for User Dashboard
router.get('/user/dashboard', authMiddleware, (req, res) => {
    if (req.session.user.role !== 'USER') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    res.json({ msg: 'Welcome to User Dashboard' });
});

// Protected Route for Admin Dashboard - To Fetch All Users
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
    if (req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ msg: 'Access denied' });
    }
    try {
        const users = await User.find({}, '-password'); // Exclude password
        res.json({ msg: 'Welcome to Admin Dashboard', users });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
