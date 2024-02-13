const Payment = require("../models/payment");
const Trip = require("../models/trip");
const TripUser = require("../models/trip_user");

const createPayment = async (req, res) => {
    const { by, to, amount, trip_id } = req.body;
    const trip = await Trip.findById(trip_id);
    if (!trip) return res.json({ status: 400, message: "Trip not found" });
    if (by === to) return res.json({ status: 400, message: "Cannot pay to self" });
    const tripuser1 = await TripUser.findById(by);
    const tripuser2 = await TripUser.findById(to);
    if (!tripuser1 || !tripuser2) return res.json({ status: 400, message: "User not found" });
    if (tripuser1.trip.toString() !== trip_id || tripuser2.trip.toString() !== trip_id) return res.json({ status: 400, message: "User not in trip" });
    const payment = await Payment.create({ trip: trip_id, amount, by, to });
    trip.payments.push(payment._id);
    await trip.save();
    return res.json({ status: 200, message: "Payment created", data: payment });
}

const deletePayment = async (req, res) => {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('trip');
    if (!payment) return res.json({ status: 400, message: "Payment not found" });
    const trip = await Trip.findById(payment.trip._id);
    trip.payments = trip.payments.filter((p) => p.toString() !== id);
    await trip.save();
    await payment.delete();
    return res.json({ status: 200, message: "Payment deleted" });
}

module.exports = {
    createPayment,
    deletePayment
}