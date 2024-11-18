const mongoose = require('mongoose');

// Order schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['bid', 'ask'], required: true },
    mealPoints: { type: Number, required: true },
    pricePerMealPoint: { type: Number, required: true },
    status: { type: String, enum: ['open', 'fulfilled'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
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

module.exports = { User, Order };
