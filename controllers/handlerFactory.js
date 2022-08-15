// importing modules
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');


// deleting any document
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id); //finding the document by id and deleting it

    if (!doc) {
      return next(new AppError('No document found with that ID', 404)); //If not found then sending error
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });


// updating single document
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    // finding by id and updating it
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // if not found any document then sending error
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });


  // creating single document
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {

    // creating 
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });


  // getting single document
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {

    // getting guery(what to find as well as sorting, pagination and other options)
    let query = Model.findById(req.params.id);

    // if popOptions available then populating query by given 
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // if document not found then returning error
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });


// getting all documents
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    
    let filter = {};
   
    // using Api features created in utils folder for filtering, paginating sorting and limiting
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
