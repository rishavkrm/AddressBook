// importing modules
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');


// signing token with the secret and user Id as payload
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};


const createSendToken = (user, statusCode, res) => {
  // creating token by first signing token with secret key and user Id as payload
  const token = signToken(user._id);
  // setting expiration date of cookie 
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // setting a cookie having token and cookie options (expiration date etc..)
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  // sending status and token created
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};


// Signup
exports.signup = catchAsync(async (req, res, next) => {
  // creating new user by name, email, password and passwordconfirm
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // using create send token to create a jwt token, setting it as cookie and sending the token
  createSendToken(newUser, 201, res);
});


// Login
exports.login = catchAsync(async (req, res, next) => {
  // getting email and password from body
  const { email, password } = req.body;
  //Checking if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  //Checking if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If everything ok, send token to client
  createSendToken(user, 200, res);
});


// logging out 
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).redirect('/users/login');
};

// protecting the route 
exports.protect = catchAsync(async (req, res, next) => {
  //Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // Verifying token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Checking if user still exists
  const currentUser = await User.findById(decoded.id);
  
  // if not exists then sending new error
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  
  //Checking if user changed password after the token was issued by using method made on userSchema
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});


// forgot password

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Getting user based on posted email
  const user = await User.findOne({ email: req.body.email });

  // If not found then sending error
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // Generating the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Sending the token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

// reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Getting user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Updating changedPasswordAt property for the user
  //Loggig the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  //Check if POSTed current password is correct by using method made on user schema
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  //If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  //Log user in, send JWT
  createSendToken(user, 200, res);
});


// getting JWT

exports.getJWT = catchAsync(async (req, res, next) => {
  // Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  // if token not found then sending an error
  if (!token) {
    return next(
      new AppError('Token not available !!!', 401)
    );
  }
  // sending token if everything goes well
  res.status(201).json({
    status: 'success',
    JWT_Token: token
  });
})