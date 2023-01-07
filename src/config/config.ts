import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const TWO_FACTOR_KEY = process.env.TWO_FACTOR_KEY ? String(process.env.TWO_FACTOR_KEY) : '';
const SECRET_KEY = process.env.SECRET_KEY ? String(process.env.SECRET_KEY) : '';
const EMAIL_HOST_USER = process.env.EMAIL_HOST_USER ? String(process.env.EMAIL_HOST_USER) : '';
const EMAIL_HOST_PASSWORD = process.env.EMAIL_HOST_PASSWORD ? String(process.env.EMAIL_HOST_PASSWORD) : '';
const MONGO_URL = process.env.MONGO_URL ? String(process.env.MONGO_URL) : 'mongodb://127.0.0.1:27017/splitr';

export const config = {
    PORT,
    TWO_FACTOR_KEY,
    SECRET_KEY,
    EMAIL_HOST_USER,
    EMAIL_HOST_PASSWORD,
    MONGO_URL
};
