import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './utilities/logging';
import authRouter from './routes/login';
import userRouter from './routes/user';
import tripRouter from './routes/trip';
import cors from 'cors';
import { authMiddleware } from './middlewares/auth';

const router = express();

/** Connect to Mongo */
mongoose
    .set('strictQuery', true)
    .connect(config.MONGO_URL, {})
    .then(() => {
        Logging.success('Mongo connected successfully.');
        StartServer();
    })
    .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req: Request, res: Response, next: NextFunction) => {
        /** Log the req */
        Logging.info(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            /** Log the res */
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());
    router.use(cors());

    /** Rules of our API */
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method == 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }

        next();
    });

    /** Routes */
    router.use('/auth', authRouter);
    router.use('/user', authMiddleware, userRouter);
    router.use('/trip', authMiddleware, tripRouter);

    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    /** Error handling */
    router.use((req: Request, res: Response, next: NextFunction) => {
        const error = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    http.createServer(router).listen(config.PORT, () => {
        Logging.verbose(`Server is running on port ${config.PORT}`);
    });
};
