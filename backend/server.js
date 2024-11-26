const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Order, Match } = require('../backend/models/User'); // Import models
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server)
const PORT = 3000;


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
    .then(() => {
        console.log('MongoDB connected');

        // Watch for real-time updates on the "users" collection
        const userCollection = mongoose.connection.collection('users');
        userCollection.watch().on('change', async (change) => {
            console.log('Database change detected (users):', change); // Debugging

            if (change.operationType === 'update') {
                const userId = change.documentKey._id; // Get the user's unique identifier

                try {
                    // Fetch the updated user from the database
                    const updatedUser = await User.findById(userId).lean(); // Use .lean() for a plain JavaScript object

                    if (updatedUser) {
                        // Emit the full user data to clients
                        console.log('Emitting balanceUpdate for user:', updatedUser.username);
                        io.emit('balanceUpdate', {
                            username: updatedUser.username,
                            mealPoints: updatedUser.mealPoints,
                            accountBalance: updatedUser.accountBalance,
                        });

                    }
                } catch (error) {
                    console.error('Error fetching updated user:', error);
                }
            }
        });

        // Watch for real-time updates on the "orders" collection
        const orderCollection = mongoose.connection.collection('orders');
        orderCollection.watch().on('change', async (change) => {
            console.log('Database change detected (orders):', change); // Debugging

            if (change.operationType === 'update' || change.operationType === 'insert') {
                try {
                    // Emit the updated orders to all connected clients
                    const orders = await Order.find({ status: 'open' }).populate('user', 'username');
                    io.emit('ordersUpdate', orders); // This will notify clients of the updated order book
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            }
        });

        const matchCollection = mongoose.connection.collection('matches');
        matchCollection.watch().on('change', async (change) => {
            console.log('Database change detected (matches):', change);

            if (change.operationType === 'insert' || change.operationType === 'update') {
                try {
                    // Fetch the latest matches for the list
                    const recentMatches = await Match.find().sort({ createdAt: -1 }).limit(10);
                    io.emit('recentMatches', recentMatches); // Notify clients of updated recent matches

                    // Fetch all matches for the graph
                    const allMatches = await Match.find().sort({ createdAt: 1 }); // Oldest to newest
                    io.emit('allMatches', allMatches); // Notify clients of updated graph data
                } catch (error) {
                    console.error('Error fetching matches:', error);
                }
            }
        });

    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if there's a connection error
    });



// Registration route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error); // Log the error for debugging
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
                accountBalance: user.accountBalance,
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
        // Validate input: check that mealPoints and accountBalance are numbers and not negative
        if (typeof mealPoints !== 'number' || typeof accountBalance !== 'number') {
            return res.status(400).json({ error: 'Meal points and account balance must be numbers' });
        }

        if (mealPoints < 0 || accountBalance < 0) {
            return res.status(400).json({ error: 'Meal points and account balance cannot be negative' });
        }

        // Find the user by username and update the meal points and account balance
        const user = await User.findOneAndUpdate(
            { username },  // Find user by username
            {
                $inc: {
                    mealPoints: mealPoints || 0,  // Increment meal points (default to 0 if not provided)
                    accountBalance: accountBalance || 0,  // Increment account balance (default to 0 if not provided)
                }
            },
            { new: true }  // Return the updated user document
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

app.post('/placeAsk', async (req, res) => {
    const { username, mealPoints, pricePerMealPoint } = req.body;

    // Validate input
    if (!username || typeof mealPoints !== 'number' || typeof pricePerMealPoint !== 'number') {
        return res.status(400).json({ error: 'Invalid input. Please check your data.' });
    }

    try {
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if the user has enough meal points
        if (user.mealPoints < mealPoints) {
            return res.status(400).json({ error: 'Insufficient meal points to place this ask.' });
        }

        // Place the ask
        const ask = new Order({
            user: user._id,
            type: 'ask',
            mealPoints,
            pricePerMealPoint,
            status: 'open',
        });
        await ask.save();

        let remainingAskPoints = mealPoints;
        let totalEarnings = 0; // Track total earnings for matched points
        const matchingBids = await Order.find({
            type: 'bid',
            pricePerMealPoint: { $gte: pricePerMealPoint },
            status: 'open',
        }).sort({ pricePerMealPoint: -1 });

        for (let bid of matchingBids) {
            if (remainingAskPoints <= 0) break;

            const pointsToMatch = Math.min(remainingAskPoints, bid.mealPoints);
            remainingAskPoints -= pointsToMatch;
            bid.mealPoints -= pointsToMatch;

            // Update bid order
            if (bid.mealPoints === 0) {
                bid.status = 'fulfilled';
            }
            await bid.save();

            // Update bid user's account
            const bidUser = await User.findById(bid.user);
            bidUser.mealPoints += pointsToMatch;
            bidUser.accountBalance -= pointsToMatch * bid.pricePerMealPoint;
            await bidUser.save();

            // Calculate earnings for matched points
            totalEarnings += pointsToMatch * bid.pricePerMealPoint;

            // Create a match record
            const match = new Match({
                askOrder: ask._id,
                bidOrder: bid._id,
                price: bid.pricePerMealPoint,
                pointsMatched: pointsToMatch,
            });
            await match.save();
        }

        // Update ask order
        if (remainingAskPoints === 0) {
            ask.status = 'fulfilled';
        } else {
            ask.mealPoints = remainingAskPoints;
        }
        await ask.save();

        // Update ask user's meal points and account balance
        user.mealPoints -= (mealPoints - remainingAskPoints); // Deduct only the used meal points
        user.accountBalance += totalEarnings; // Add earnings from matched points
        await user.save();

        res.status(201).json({
            message: 'Ask placed successfully.',
            remainingPoints: remainingAskPoints,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to place ask due to server error.' });
    }
});




app.post('/placeBid', async (req, res) => {
    const { username, mealPoints, pricePerMealPoint } = req.body;

    // Validate input
    if (!username || typeof mealPoints !== 'number' || typeof pricePerMealPoint !== 'number') {
        return res.status(400).json({ error: 'Invalid input. Please check your data.' });
    }

    try {
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if the user has enough money to place the bid
        const totalBidAmount = mealPoints * pricePerMealPoint;
        if (user.accountBalance < totalBidAmount) {
            return res.status(400).json({ error: 'Insufficient funds to place this bid.' });
        }

        // Place the bid
        const bid = new Order({
            user: user._id,
            type: 'bid',
            mealPoints,
            pricePerMealPoint,
            status: 'open',
        });
        await bid.save();

        let remainingBidPoints = mealPoints; // Track the unmatched points
        let totalMatchedCost = 0; // Track the total cost for matched points
        const matchingAsks = await Order.find({
            type: 'ask',
            pricePerMealPoint: { $lte: pricePerMealPoint },
            status: 'open',
        }).sort({ pricePerMealPoint: 1 });

        for (let ask of matchingAsks) {
            if (remainingBidPoints <= 0) break;

            const pointsToMatch = Math.min(remainingBidPoints, ask.mealPoints);
            remainingBidPoints -= pointsToMatch;
            ask.mealPoints -= pointsToMatch;

            // Update ask order
            if (ask.mealPoints === 0) {
                ask.status = 'fulfilled';
            }
            await ask.save();

            // Update ask user's account
            const askUser = await User.findById(ask.user);
            if (!askUser) {
                throw new Error(`Ask user with ID ${ask.user} not found.`);
            }
            askUser.mealPoints -= pointsToMatch;
            askUser.accountBalance += pointsToMatch * ask.pricePerMealPoint;
            await askUser.save();

            // Calculate the cost for matched points
            totalMatchedCost += pointsToMatch * ask.pricePerMealPoint;

            // Create a match record
            const match = new Match({
                askOrder: ask._id,
                bidOrder: bid._id,
                price: ask.pricePerMealPoint,
                pointsMatched: pointsToMatch,
            });
            await match.save();
        }

        // Update bid order
        if (remainingBidPoints === 0) {
            bid.status = 'fulfilled';
        } else {
            bid.mealPoints = remainingBidPoints;
        }
        await bid.save();

        // Deduct only the used amount from user's account
        user.accountBalance -= totalMatchedCost;
        await user.save();

        res.status(201).json({
            message: 'Bid placed successfully.',
            remainingPoints: remainingBidPoints,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to place bid due to server error.' });
    }
});


app.get('/user/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch user data from the database
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send the user data in the response
        res.json({
            username: user.username,
            mealPoints: user.mealPoints,
            accountBalance: user.accountBalance,
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getMatches', async (req, res) => {
    console.log('Request received for /getMatches');  // Log when the request is received
    try {
        const matches = await Match.find()
            .populate('askOrder', 'user mealPoints pricePerMealPoint')
            .populate('bidOrder', 'user mealPoints pricePerMealPoint')
            .sort({ createdAt: -1 });

        // console.log('Matches found:', matches);  // Log the matches fetched from the database
        res.status(200).json(matches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch matches due to server error.' });
    }
});
app.post('/update-balance', async (req, res) => {
    const { username, newMealPoints, newAccountBalance } = req.body;

    try {
        const user = await User.findOneAndUpdate(
            { username },
            { mealPoints: newMealPoints, accountBalance: newAccountBalance },
            { new: true }
        );

        if (user) {
            // Emit balance update to all connected clients
            io.emit('balanceUpdate', {
                username: user.username,
                mealPoints: user.mealPoints,
                accountBalance: user.accountBalance,
            });
        }

        res.status(200).json({ message: 'Balance updated successfully.' });
    } catch (error) {
        console.error('Error updating balance:', error);
        res.status(500).json({ error: 'Failed to update balance.' });
    }
});

// // Get all orders (both bids and asks)
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'open' }).populate('user', 'username');
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
app.post('/create-order', async (req, res) => {
    const { mealPoints, pricePerMealPoint, type, userId } = req.body;
    const order = new Order({ mealPoints, pricePerMealPoint, type, user: userId, status: 'open' });

    try {
        await order.save();
        io.emit('ordersUpdate', await Order.find({ status: 'open' }).populate('user', 'username'));
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Real-Time Updates with Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);


    // Send new matches to clients in real-time
    const sendAllMatches = async () => {
        try {
            const allMatches = await Match.find().sort({ createdAt: 1 }); // Oldest to newest
            socket.emit('allMatches', allMatches);
        } catch (error) {
            console.error('Error fetching all matches:', error);
        }
    };


    // Send 10 most recent matches for the list
    const sendRecentMatches = async () => {
        try {
            const recentMatches = await Match.find().sort({ createdAt: -1 }).limit(10); // Newest to oldest
            socket.emit('recentMatches', recentMatches);
        } catch (error) {
            console.error('Error fetching recent matches:', error);
        }
    };

    // Emit both sets of data
    sendAllMatches();
    sendRecentMatches();

    const sendBalanceUpdates = async () => {
        setInterval(async () => {
            const user = await User.findOne({ username: 'exampleUsername' }); // Replace with real user lookup
            if (user) {
                socket.emit('balanceUpdate', {
                    username: user.username, // Send the username with the data
                    mealPoints: user.mealPoints,
                    accountBalance: user.accountBalance,
                });
            }
        }, 5000); // Update every 5 seconds
    };

    sendBalanceUpdates();


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});



server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});