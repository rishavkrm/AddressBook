// importing modules
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// initializing router
const router = express.Router();


// handaling signup, login, logout, getJWT, forgotPassword, resetPassword
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/getJWT', authController.getJWT);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

// updating user's password, making /me endpoint, updating user and deleting user
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);


// handaling '/api/users' route
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


  // exporting router to use in app.js
module.exports = router;
