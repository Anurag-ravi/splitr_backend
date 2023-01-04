const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    country_code: {type: String, required: true},
    email: {type: String, required: true,unique: true},
    phone: {type: String, required: true,unique: true},
    trips: [{type: mongoose.Schema.Types.ObjectId, ref: 'Trip'}],
    upi_id: {type: String,unique: true},
    verified: {type: Boolean, default: false},
    created: {type: Date, default: Date.now}
});

const User = mongoose.model('User', userSchema);
module.exports = User;