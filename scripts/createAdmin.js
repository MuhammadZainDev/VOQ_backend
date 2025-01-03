// scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Ensure correct path
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected...');

        // Check if admin already exists
        let admin = await User.findOne({ email: 'admin@gmail.com' });
        if (admin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('adminadmin', salt);

        // Create admin user
        admin = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            number: '0000000000', // Replace with actual number if needed
            role: 'ADMIN',
            password: hashedPassword,
        });

        await admin.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

createAdmin();
