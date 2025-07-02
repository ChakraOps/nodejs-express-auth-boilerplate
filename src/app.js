const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const limiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
//app.use(xss());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
