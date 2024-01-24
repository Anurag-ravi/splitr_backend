const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middlewares/auth');
const { createTrip, getTrips } = require('../controllers/trip');

router.post('/new',authMiddleware,createTrip);
router.get('/',authMiddleware,getTrips);

module.exports = router;