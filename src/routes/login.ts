import express from 'express';

import { login, verify, register } from '../controllers/login';

const router = express.Router();

router.post('/login', login);
router.post('/verify', verify);
router.post('/register', register);

export default router;
