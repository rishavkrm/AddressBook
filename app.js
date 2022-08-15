// importing modules
const express = require('express');
const cookieParser = require('cookie-parser');

// importing required dependencies
const AppError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');
const contactRouter = require('./routes/contactRoutes');
const userRouter = require('./routes/userRoutes');


const app = express();

// Body parser, reading data from body into req.body
app.use(express.json());
app.use(cookieParser());


// ROUTES
app.use('/api/contacts', contactRouter);
app.use('/api/users', userRouter);


// If it is coming here that means it was not able to find any routes
app.all('*', (req, res, next) => {
  // console.log("Can't find this route on this server!")
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// using error controller
app.use(errorHandler);


// exporting the module to use in server.js
module.exports = app;
