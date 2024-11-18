const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Order } = require('../backend/models/User'); // Import models

const app = express();

// CORS configuration: Allow only your frontend (React) to access
const corsOptions = {
    origin: 'http://localhost:3001', // Allow your frontend running on port 3001
    methods: ['GET', 'POST'], // Allowed methods
    allowedHeaders: ['Content-Type'], // Allowed headers
};

app.use(cors(corsOptions)); // Enable CORS for your API
app.use(express.json()); // For parsing JSON requests

// MongoDB connection
mongoose.connect('mongodb+srv://rivakranz:w0VI95bttu0hEVFC@cluster0.ijhei.mongodb.net/mealpoint?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.log('MongoDB connection error:', err);
        process.exit(1); // Exit if there's a connection error
    });

// Registration route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error); // Log the error
        res.status(500).json({ error: 'Failed to register user' });
    }
});


// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Send back the user data including account balance (money)
        res.status(200).json({
            message: 'Login successful',
            user: {
                username: user.username,
                buySell: user.buySell,
                mealPoints: user.mealPoints,
                buySellPrice: user.buySellPrice,
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

app.post('/updatepoints', async (req, res) => {
    const { username, mealPoints, accountBalance } = req.body;

    try {
        // Validate input (checking that mealPoints and accountBalance are numbers)
        if (typeof mealPoints !== 'number' || typeof accountBalance !== 'number') {
            return res.status(400).json({ error: 'Meal points and account balance must be numbers' });
        }

        // Find the user by username
        const user = await User.findOneAndUpdate(
            { username },  // Find user by username
            {
                $inc: {
                    mealPoints: mealPoints || 0, // Increment mealPoints (default 0 if not provided)
                    accountBalance: accountBalance || 0, // Increment accountBalance (default 0 if not provided)
                }
            },
            { new: true } // Return the updated user document
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Points updated successfully', user });
    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({ error: 'Failed to update points' });
    }
});
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
