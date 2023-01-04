const mongoose = require('mongoose');

const tripUserSchema = new mongoose.Schema({
    trip: {type: mongoose.Schema.Types.ObjectId, ref: 'Trip',required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String},
    paid: {type: Number, default: 0},
    owed: {type: Number, default: 0},
    is_involved: {type: Boolean, default: true},
});

const TripUser = mongoose.model('TripUser', tripUserSchema);
module.exports = TripUser;