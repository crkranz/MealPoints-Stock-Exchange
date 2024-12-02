const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Order, Match, Offer, Message } = require('../backend/models/User'); // Import models
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server)
const PORT = 3000;


// CORS configuration: Allow only the frontend (React) to access
const corsOptions = {
    origin: 'http://localhost:3001', // Allow your frontend running on port 3001
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type'], // Allowed headers
};

app.use(cors(corsOptions)); // Enable CORS for API
app.use(express.json()); // to parse JSON requests

// MongoDB connection
mongoose.connect('mongodb+srv://rivakranz:w0VI95bttu0hEVFC@cluster0.ijhei.mongodb.net/mealpoint?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected');

        // Watch for real-time updates on the users collection
        const userCollection = mongoose.connection.collection('users');
        userCollection.watch().on('change', async (change) => {
            console.log('Database change detected (users):', change); // Log the full change object

            if (change.operationType === 'update') {
                console.log('Update operation detected'); // Confirm right operation type

                const userId = change.documentKey._id; // Extract user ID
                console.log('Extracted user ID:', userId);

                try {
                    // Fetch the updated user from the database
                    const updatedUser = await User.findById(userId).lean();
                    console.log('Fetched updated user:', updatedUser);

                    if (updatedUser) {
                        // Emit the updated balance to the client
                        console.log('Emitting balanceUpdate for user:', updatedUser.username);
                        io.emit('balanceUpdate', {
                            username: updatedUser.username,
                            mealPoints: updatedUser.mealPoints,
                            accountBalance: updatedUser.accountBalance,
                        });
                    } else {
                        console.warn('No user found for ID:', userId);
                    }
                } catch (error) {
                    console.error('Error fetching updated user:', error);
                }
            } else {
                console.log('Operation type is not "update":', change.operationType);
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
        // check that mealPoints and accountBalance are numbers and not negative
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
                    mealPoints: mealPoints || 0,  // Increment meal points 
                    accountBalance: accountBalance || 0,  // Increment account balance 
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

            // Skip self-match
            if (String(bid.user) === String(user._id)) {
                console.log(`Skipping self-match for user ${user.username}`);
                continue; // Skip balance updates if the user is the same
            }

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

            // Skip self-match
            if (String(ask.user) === String(user._id)) {
                console.log(`Skipping self-match for user ${user.username}`);
                continue; // Skip balance updates if the user is the same
            }

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

app.get('/orders/:orderId', async (req, res) => {
    const { orderId } = req.params; // Extract orderId from request parameters

    try {
        // Fetch the order by its ID, ensuring it's a valid ObjectId
        const order = await Order.findById(orderId)
            .populate('user', 'username') // Populate the user field to get the username
            .exec();

        // If no order is found, return error
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Return the found order
        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

app.patch('/reject/:id', async (req, res) => {
    try {
        const offerId = req.params.id;

        // Find the offer by its ID and update its status to 'denied'
        const offer = await Offer.findByIdAndUpdate(
            offerId,
            { status: 'denied' },
            { new: true } // Return the updated document
        );

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json(offer); // Send the updated offer back
    } catch (error) {
        console.error('Error rejecting offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.patch('/acceptOfferOnBid/:id', async (req, res) => {
    try {
        const offerId = req.params.id;

        // Find the offer by its ID
        const offer = await Offer.findById(offerId).populate('orderId');
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        const { mealPoints: offerMealPoints, pricePerMealPoint: offerPricePerMealPoint, senderUsername, receiverUsername, orderId } = offer;

        // Ensure the associated order exists
        const order = await Order.findById(orderId._id);
        if (!order) {
            return res.status(404).json({ error: 'Associated order not found' });
        }

        // Check if the order is still open
        if (order.status !== 'open') {
            return res.status(400).json({ error: 'Order is no longer open.' });
        }

        // Update the associated order status to 'fulfilled'
        order.status = 'fulfilled';
        await order.save();

        // Create a match for the transaction
        const match = new Match({
            bidOrder: orderId._id, // Reference to the matched order
            price: offerPricePerMealPoint, // Match price
            pointsMatched: offerMealPoints, // Matched points
        });
        await match.save();

        // Update sender and receiver balances
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });

        if (!sender || !receiver) {
            return res.status(404).json({ error: 'Sender or Receiver not found' });
        }

        const transactionValue = offerMealPoints * offerPricePerMealPoint;

        // Deduct meal points and add balance to the sender
        sender.mealPoints -= offerMealPoints;
        sender.accountBalance += transactionValue;

        // Add meal points and deduct balance from the receiver
        receiver.mealPoints += offerMealPoints;
        receiver.accountBalance -= transactionValue;

        await sender.save();
        await receiver.save();

        // Update the offer status to 'accepted'
        offer.status = 'accepted';
        await offer.save();

        res.json({
            message: 'Offer accepted successfully!',
            updatedOffer: offer,
            match,
            sender: { username: sender.username, mealPoints: sender.mealPoints, accountBalance: sender.accountBalance },
            receiver: { username: receiver.username, mealPoints: receiver.mealPoints, accountBalance: receiver.accountBalance },
        });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.patch('/acceptOfferOnAsk/:id', async (req, res) => {
    try {
        const offerId = req.params.id;

        // Find the offer by its ID
        const offer = await Offer.findById(offerId).populate('orderId');
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        const { mealPoints: offerMealPoints, pricePerMealPoint: offerPricePerMealPoint, senderUsername, receiverUsername, orderId } = offer;

        // Ensure the associated order exists
        const order = await Order.findById(orderId._id);
        if (!order) {
            return res.status(404).json({ error: 'Associated order not found' });
        }

        // Check if the order is still open
        if (order.status !== 'open') {
            return res.status(400).json({ error: 'Order is no longer open.' });
        }

        // Update the associated order status to 'fulfilled'
        order.status = 'fulfilled';
        await order.save();

        // Create a match for the transaction
        const match = new Match({
            askOrder: orderId._id, // Reference to the matched order
            price: offerPricePerMealPoint, // Match price
            pointsMatched: offerMealPoints, // Matched points
        });
        await match.save();

        // Update sender and receiver balances
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });

        if (!sender || !receiver) {
            return res.status(404).json({ error: 'Sender or Receiver not found' });
        }

        const transactionValue = offerMealPoints * offerPricePerMealPoint;

        // Deduct balance and add meal points to the sender
        sender.accountBalance -= transactionValue;
        sender.mealPoints += offerMealPoints;

        // Add balance and deduct meal points from the receiver
        receiver.accountBalance += transactionValue;
        receiver.mealPoints -= offerMealPoints;

        await sender.save();
        await receiver.save();

        // Update the offer status to 'accepted'
        offer.status = 'accepted';
        await offer.save();

        res.json({
            message: 'Offer accepted successfully!',
            updatedOffer: offer,
            match,
            sender: { username: sender.username, mealPoints: sender.mealPoints, accountBalance: sender.accountBalance },
            receiver: { username: receiver.username, mealPoints: receiver.mealPoints, accountBalance: receiver.accountBalance },
        });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ error: 'Internal server error' });
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
app.post('/sendMessage', async (req, res) => {
    const { from, to, message } = req.body;

    if (!from || !to || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newMessage = new Message({ from, to, message });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/getMessages', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Both from and to query parameters are required' });
    }

    try {
        const messages = await Message.find({
            $or: [
                { from, to },
                { from: to, to: from },
            ],
        }).sort({ timestamp: 1 }); // Sort messages by timestamp (oldest first)
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/getDMUsers', async (req, res) => {
    const { user } = req.query; // Get logged-in user's username

    if (!user) {
        return res.status(400).json({ error: 'User parameter is required' });
    }

    try {
        // Fetch all distinct users who have sent messages to the logged-in user
        const users = await Message.distinct('from', { to: user });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching DM users:', error);
        res.status(500).json({ error: 'Failed to fetch DM users' });
    }
});

app.post('/create-offer', async (req, res) => {
    try {
        const { senderUsername, receiverUsername, mealPoints, pricePerMealPoint, orderId } = req.body;

        // Validate input
        if (!senderUsername || !receiverUsername || !mealPoints || !pricePerMealPoint || !orderId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if the order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Fetch sender user details
        const sender = await User.findOne({ username: senderUsername });
        if (!sender) {
            return res.status(404).json({ error: 'Sender not found.' });
        }

        // Calculate the total cost of the offer
        const totalCost = mealPoints * pricePerMealPoint;

        // Validate sender has sufficient resources based on order type
        if (order.type === 'ask') {
            // For "ask" orders, sender must have enough money
            if (sender.accountBalance < totalCost) {
                return res.status(400).json({ error: 'Insufficient funds to create this offer.' });
            }
        } else if (order.type === 'bid') {
            // For "bid" orders, sender must have enough meal points
            if (sender.mealPoints < mealPoints) {
                return res.status(400).json({ error: 'Insufficient meal points to create this offer.' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid order type.' });
        }

        // Construct the offer message dynamically
        const offerMessage = `${mealPoints} meal points for $${pricePerMealPoint} per meal point`;

        // Create and save the offer
        const newOffer = new Offer({
            senderUsername,
            receiverUsername,
            mealPoints,
            pricePerMealPoint,
            orderId,
            offerText: offerMessage, // Include the dynamic offer message
        });

        await newOffer.save();

        res.status(201).json({ message: 'Offer created successfully', offer: newOffer });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/offers/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const userOffers = await Offer.find({
            $or: [
                { senderUsername: username },
                { receiverUsername: username }
            ],
            status: 'pending' // Only include offers with status "pending"
        }).populate('orderId');

        res.status(200).json(userOffers);
    } catch (error) {
        console.error('Error fetching user offers:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

let users = {};
// implement real-time with Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (username) => {
        users[username] = socket.id;
        console.log(`${username} registered with socket ID: ${socket.id}`);
    });

    socket.on('sendMessage', (data) => {
        const { from, to, message } = data;

        // Emit the message to both users (from and to)
        if (users[to]) {
            io.to(users[to]).emit('receiveMessage', { from, message });
        }
        if (users[from]) {
            io.to(users[from]).emit('receiveMessage', { from, message });
        }

    });
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

    const sendBalanceUpdates = async (socket, username) => {
        setInterval(async () => {
            const user = await User.findOne({ username });
            if (user) {
                socket.emit('balanceUpdate', {
                    username: user.username,
                    mealPoints: user.mealPoints,
                    accountBalance: user.accountBalance,
                });
            }
        }, 5000); // Update every 5 seconds
    };


    sendBalanceUpdates();


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let username in users) {
            if (users[username] === socket.id) {
                delete users[username];
                break;
            }
        }
    });
});



server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
