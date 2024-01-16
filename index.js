const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./src/config/config');
const Logging = require('./src/utilities/logging');
const router = express();

/** Connect to Mongo */
mongoose
    .set('strictQuery', true)
    .connect(config.MONGODB_URI, {})
    .then(() => {
        Logging.success('Mongo connected successfully.');
        StartServer();
    })
    .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req, res, next) => {
        /** Log the req */
        Logging.info(`Incoming - [${req.method} ${req.url}]`);

        res.on('finish', () => {
            /** Log the res */
            Logging.info(`Result : [${req.method} ${req.url}] - STATUS: ${res.statusCode}`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: false }));
    router.use(express.json());
    router.use(cors());


    /** Routes */

    router.get('/', (req, res) => {
        res.status(200).json({ hello: 'world' });
    });
    router.use('/auth', require('./src/routes/login'));

    const httpServer = http.createServer(router);
    httpServer.listen(config.PORT, () => {
        Logging.verbose(`Server is running on port ${config.PORT}`);
    });
};