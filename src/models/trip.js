const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    code: {type: String, unique: true, required: true},
    name: {type: String, required: true},
    description: {type: String, default: ''},
    created: {type: Date, default: Date.now},
    currency: {type: String, default: 'INR'},
    created_by: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    users: [{type: mongoose.Schema.Types.ObjectId, ref: 'TripUser'}],
    expenses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Expense'}],
    payments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Payment'}]
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;