// routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../../backend/models/User'); // Ensure this path is correct
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Registering user:', username);

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('User already exists:', username);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
        });

        // Save user and log result
        await newUser.save();
        console.log('User successfully saved:', newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Logging in user:', username);

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ message: 'Incorrect credentials' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            console.log('Incorrect password for user:', username);
            return res.status(400).json({ message: 'Incorrect credentials' });
        }

        console.log('Login successful for user:', username);
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});
// router.post('/update-user-points', async (req, res) => {
//     const { username, mealPoints, accountBalance } = req.body;

//     try {
//         // Find user by username (not by ObjectId)
//         const user = await User.findOne({ username });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Update mealPoints and accountBalance if provided
//         if (mealPoints !== undefined) {
//             user.mealPoints = (user.mealPoints || 0) + mealPoints;
//         }
//         if (accountBalance !== undefined) {
//             user.accountBalance = (user.accountBalance || 0) + accountBalance;
//         }

//         // Save the updated user
//         await user.save();
//         return res.status(200).json({ message: 'User updated successfully', user });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// });


module.exports = router;
