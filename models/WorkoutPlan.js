const mongoose = require('mongoose');

const WorkoutPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  file: {
    type: String,
    required: [true, 'Please upload a PDF file'],
    match: [/^https?:\/\/.+\.pdf$/, 'File must be a valid PDF URL'] // extra safety for Cloudinary URLs
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign to a member']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by is required']
  },
  assignedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
