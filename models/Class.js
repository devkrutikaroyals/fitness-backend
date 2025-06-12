const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true,
    maxlength: [50, 'Class name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  schedule: {
    type: Date,
    required: [true, 'Please add a schedule date and time']
  },
  duration: {
    type: Number,
    required: [true, 'Please add class duration in minutes'],
    min: [1, 'Duration must be at least 1 minute']
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify class capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  instructor: {
    type: String,
    required: [true, 'Please specify the instructor name'],
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  enrolledMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', ClassSchema);
