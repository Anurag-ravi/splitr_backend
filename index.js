require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { authMiddleware } = require('./src/middlewares/auth');
const app = express();
const { PORT } = process.env;
const port = 5000 || PORT;

app.use(bodyParser.json()) ;
app.use(express.json());

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/user', require('./src/routes/login'));
app.use('/trip',authMiddleware, require('./src/routes/trip'));

mongoose.connect('mongodb://127.0.0.1:27017/splitr', {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log('Connected to database');
    }
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));