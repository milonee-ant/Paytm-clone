// backend/db.js
const { mongoose } = require("mongoose");
const { mongodbUri } = require("../config.js");
mongoose.connect(mongodbUri);

// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
    },
});

// Accounts Table Schema
//  In the real world, you shouldn't store `floats` for balances in the database.
//   You usually store an integer which represents the USD value with
//   decimal places(for eg, if someone has 33.33 dollars in their account,
// you store 3333 in the database).
//
//
//   There is a certain precision that you need to support(which for USD is
//   2 decimal places) and this allows you to get rid of precision
//  errors by storing integers in your DB

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: "User",
        required: true,
    },
    balance: {
        type: Number,
        required: true,
    },
});

// Transaction Schema for tracking spending history
const transactionSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        enum: ['Food', 'Entertainment', 'Rent', 'Bills', 'Shopping', 'Transportation', 'Healthcare', 'Other'],
        default: 'Other',
    },
    status: {
        type: String,
        enum: ['completed', 'failed'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

// Add indexes for query performance
transactionSchema.index({ senderId: 1, timestamp: -1 });
transactionSchema.index({ senderId: 1, status: 1 });

// Create a model from the schema
const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
    User,
    Account,
    Transaction,
};
