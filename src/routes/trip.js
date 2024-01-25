const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middlewares/auth');
const { createTrip, getTrips, joinTrips } = require('../controllers/trip');

router.post('/new',authMiddleware,createTrip);
router.get('/',authMiddleware,getTrips);
router.post('/join',authMiddleware,joinTrips);

module.exports = router;