const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middlewares/auth');
const { createTrip, getTrips, joinTrips, getTrip } = require('../controllers/trip');

router.post('/new',authMiddleware,createTrip);
router.get('/',authMiddleware,getTrips);
router.get('/:id',authMiddleware,getTrip)
router.post('/join',authMiddleware,joinTrips);

module.exports = router;