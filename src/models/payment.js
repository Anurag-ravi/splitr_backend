const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    trip: {type: mongoose.Schema.Types.ObjectId, ref: 'Trip',required: true},
    amount: {type: Number, required: true,default:0.0},
    description: {type: String, default: ''},
    created: {type: Date, default: Date.now},
    by: {type: mongoose.Schema.Types.ObjectId, ref: 'TripUser',required: true},
    to: {type: mongoose.Schema.Types.ObjectId, ref: 'TripUser',required: true},
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;