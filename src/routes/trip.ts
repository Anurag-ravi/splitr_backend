import express from 'express';

import { allTrip, createTrip } from '../controllers/trip';

const router = express.Router();

router.get('/', allTrip);
router.post('/new', createTrip);

export default router;
