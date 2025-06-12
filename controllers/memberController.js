// controllers/memberController.js
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Get all available classes
exports.getAvailableClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find()
    .select('name description schedule duration capacity instructor enrolledMembers')
    .lean();
    
  res.status(200).json({
    success: true,
    data: classes
  });
});

// Get member's enrolled classes
exports.getMyClasses = asyncHandler(async (req, res) => {
  const member = await User.findById(req.user.id)
    .populate('classes', 'name schedule instructor')
    .lean();
    
  if (!member) {
    return res.status(404).json({
      success: false,
      message: 'Member not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: member.classes || []
  });
});

// Enroll in a class
exports.enrollInClass = asyncHandler(async (req, res) => {
  const classId = req.params.id;
  const memberId = req.user.id;
  
  // Check if class exists and has capacity
  const classToEnroll = await Class.findById(classId);
  if (!classToEnroll) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }
  
  if (classToEnroll.enrolledMembers.length >= classToEnroll.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Class is full'
    });
  }
  
  // Check if already enrolled
  if (classToEnroll.enrolledMembers.includes(memberId)) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this class'
    });
  }
  
  // Update class and user
  await Promise.all([
    Class.findByIdAndUpdate(classId, {
      $addToSet: { enrolledMembers: memberId }
    }),
    User.findByIdAndUpdate(memberId, {
      $addToSet: { classes: classId }
    })
  ]);
  
  res.status(200).json({
    success: true,
    message: 'Successfully enrolled in class'
  });
});