// importing modules
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


// filtering oblects by only allowing allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};


// making getme and exporting to use in user router
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //getting document
  next();
};

// making updateme (except updating user password) and exporting to use in user router
exports.updateMe = catchAsync(async (req, res, next) => {
  // Creating error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // Filtering out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //Updating user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // Sending response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});


//making deleteme and exporting to use in user router
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});


// user can only be created using signup
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};


// by using factory functions
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);


exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
