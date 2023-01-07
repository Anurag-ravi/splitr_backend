import express from 'express';

import { allTrip, createTrip, detailTrip, joinTrip, updateTrip } from '../controllers/trip';

const router = express.Router();

router.get('/', allTrip);
router.post('/new', createTrip);
router.get('/:code', detailTrip);
router.put('/:code', updateTrip);
router.post('/join', joinTrip);

export default router;
