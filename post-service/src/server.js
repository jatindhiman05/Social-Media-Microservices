require('dotenv').config()
const express = require('express');

const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')

const app = express();

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI)

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to MongoDb'))
    .catch(e => logger.error('Mongo Connection error', e));

const redisClient = new Redis(process.env.REDIS_URL)

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next();
})

// *** homework 

// pass redis client to routes
app.use('/api/posts',(req,res,next)=>{
    req.redisClient = redisClient
    next()
},postRoutes)


app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`)
})


//unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason:", reason);
})