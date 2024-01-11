const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitr';
const JWT_SECRET = process.env.JWT_SECRET || 'nclshfcnz,cOIDEUWEC^%&@^*&ww*(@yIWEUN';
const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD

module.exports = {
    PORT,
    MONGODB_URI,
    JWT_SECRET,
    EMAIL,
    PASSWORD
}