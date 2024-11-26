const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['bid', 'ask'],
        required: true
    },
    mealPoints: {
        type: Number,
        required: true
    },
    pricePerMealPoint: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'fulfilled'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    }]
});
const Order = mongoose.model('Order', orderSchema);

// User schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

    mealPoints: {
        type: Number,
        required: false,
    },
    accountBalance: {
        type: Number,
        required: false,
    },

    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }],
});

const User = mongoose.model('User', userSchema);

const matchSchema = new mongoose.Schema({
    askOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    bidOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    pointsMatched: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Match = mongoose.model('Match', matchSchema);


module.exports = { User, Order, Match };
