const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    trip: {type: mongoose.Schema.Types.ObjectId, ref: 'Trip',required: true},
    name: {type: String, required: true},
    amount: {type: Number, required: true},
    category: {type: String,enum: ['food', 'transport', 'accomodation', 'shopping', 'entertainment', 'other'], required: true, default: 'other'},
    description: {type: String, default: ''},
    created: {type: Date, default: Date.now},
    paid_by: [{
        user : {type: mongoose.Schema.Types.ObjectId, ref: 'TripUser',required: true},
        amount: {type: Number, required: true}
    }],
    paid_for: [{
        user : {type: mongoose.Schema.Types.ObjectId, ref: 'TripUser',required: true},
        amount: {type: Number, required: true}
    }],
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;