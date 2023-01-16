import express from 'express';

import { getUser, updateProfile } from '../controllers/user';

const router = express.Router();

router.get('/', getUser);
router.post('/update', updateProfile);

export default router;
