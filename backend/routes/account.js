const express = require('express');
const { authMiddleware } = require('../middleware.js');
const { Account, Transaction } = require('../db/db.js');
const { default: mongoose } = require('mongoose');
const router = express.Router();


// An endpoint for user to get their balance.
router.get("/balance", authMiddleware, async function (req, res) {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    });
});


// An endpoint for user to transfer money to another account
router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to, category } = req.body;

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        // Save failed transaction
        await Transaction.create({
            senderId: req.userId,
            receiverId: to,
            amount: amount,
            category: category || 'Other',
            status: 'failed',
            timestamp: new Date()
        });
        return res.status(200).json({
            message: "Insufficient balance",
            status: "-1"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        // Save failed transaction
        await Transaction.create({
            senderId: req.userId,
            receiverId: to,
            amount: amount,
            category: category || 'Other',
            status: 'failed',
            timestamp: new Date()
        });
        return res.status(200).json({
            message: "Invalid account",
            status: "-1"
        });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Save successful transaction
    await Transaction.create({
        senderId: req.userId,
        receiverId: to,
        amount: amount,
        category: category || 'Other',
        status: 'completed',
        timestamp: new Date()
    });

    // Commit the transaction
    await session.commitTransaction();
    res.status(200).json({
        message: "Transfer successful",
        status: "1"
    });
});

// An endpoint to get spending analytics
router.get("/analytics", authMiddleware, async (req, res) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Spending by person
    const spendingByPerson = await Transaction.aggregate([
        {
            $match: {
                senderId: new mongoose.Types.ObjectId(req.userId),
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$receiverId',
                totalAmount: { $sum: '$amount' },
                transactionCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'receiver'
            }
        },
        {
            $unwind: '$receiver'
        },
        {
            $project: {
                receiverName: {
                    $concat: ['$receiver.firstName', ' ', '$receiver.lastName']
                },
                totalAmount: 1,
                transactionCount: 1
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    // Spending by category
    const spendingByCategory = await Transaction.aggregate([
        {
            $match: {
                senderId: new mongoose.Types.ObjectId(req.userId),
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$category',
                totalAmount: { $sum: '$amount' },
                transactionCount: { $sum: 1 }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    // This month spending
    const thisMonthSpending = await Transaction.aggregate([
        {
            $match: {
                senderId: new mongoose.Types.ObjectId(req.userId),
                status: 'completed',
                timestamp: { $gte: thisMonthStart }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    // Last month spending
    const lastMonthSpending = await Transaction.aggregate([
        {
            $match: {
                senderId: new mongoose.Types.ObjectId(req.userId),
                status: 'completed',
                timestamp: {
                    $gte: lastMonthStart,
                    $lte: lastMonthEnd
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    res.json({
        spendingByPerson,
        spendingByCategory,
        thisMonthTotal: thisMonthSpending[0]?.total || 0,
        lastMonthTotal: lastMonthSpending[0]?.total || 0,
    });
});

module.exports = {
    accountRouter: router
}