const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    country_code: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: true},
    trips: [{type: mongoose.Schema.Types.ObjectId, ref: 'Trip'}],
    upi_id: {type: String, default: ''},
    verified: {type: Boolean, default: false},
    created: {type: Date, default: Date.now}
});

const User = mongoose.model('User', userSchema);
module.exports = User;