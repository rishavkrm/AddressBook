// importing modules
const express = require('express');
const contactController = require('./../controllers/contactController');
const authController = require('./../controllers/authController');


// initilizing router
const router = express.Router();


// managing '/api/contacts' endpoint
router
  .route('/')
  .get(contactController.getAllContacts)
  .post(
    authController.protect, 
    contactController.setUserIds,
    contactController.createContact
  );


// managing '/api/contacts/<contactName>' endpoint 
router
  .route('/:id')
  .get(contactController.getContact)
  .patch(
    authController.protect,
    contactController.updateContact
  )
  .delete(
    authController.protect,
    contactController.deleteContact
  );

  router
  .route('/createBulk')
  .post(authController.protect, 
    contactController.setUserIds,
    contactController.createBulkContacts
  );


// exporting router to use in app.js 
module.exports = router;
