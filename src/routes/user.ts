import express from 'express';

import { updateProfile } from '../controllers/user';

const router = express.Router();

router.post('/update', updateProfile);

export default router;
