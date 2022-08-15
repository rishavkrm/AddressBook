// importing model, factory controller
const Contact = require('./../models/contactModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');


// setting user id (making the user who is adding the contact as owner  )
exports.setUserIds = (req, res, next) => {
    // Allow nested routes
    
    if (!req.body.owner) req.body.owner = req.user.id;
    next();
  };
 
// creating functions from factory controller by giving Contact model and exporting to use in contactRouter
exports.getAllContacts = factory.getAll(Contact);
exports.getContact = factory.getOne(Contact, { path: 'owner' });
exports.createContact = factory.createOne(Contact);

exports.updateContact = factory.updateOne(Contact);
exports.deleteContact = factory.deleteOne(Contact);

exports.createBulkContacts = catchAsync(async (req, res, next) => {

  // creating 
  const bulk = req.body
  let doc = []
  
  for (let i = 0; i<bulk.length; i++){
    if (!req.body[i].owner) req.body[i].owner = req.user.id;
    doc[i] = await Contact.create(bulk[i]);
  }
 
  res.status(201).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});