const mongoose = require('mongoose');

// maing contact schema
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A contact must have a name'],
      trim: true
    },
    phone: {
      type: Number,
      unique:true,
      required: [true, 'A contact must have a contact number'],

    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Contact must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// usign pre hooks to populate owner field in schema with owner name
contactSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'owner',
    select: 'name'
  });
  next();
});


const Contact = mongoose.model('Contact', contactSchema);

// exporting contact
module.exports = Contact;
