// Keep only ONE of each
const User = require('../models/User');
const Class = require('../models/Class');
const WorkoutPlan = require('../models/WorkoutPlan'); // ✅ Only once at the top
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs'); // Add this if using fs
const cloudinary = require('cloudinary').v2;


// MEMBER CRUD
exports.getMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'member' });
  res.status(200).json({ success: true, data: members });
});

exports.createMember = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide name, email and password'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: 'member'
  });

  res.status(201).json({
    success: true,
    data: user
  });
});

exports.updateMember = asyncHandler(async (req, res) => {
  const member = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.status(200).json({ success: true, data: member });
});

exports.deleteMember = asyncHandler(async (req, res) => {
  const member = await User.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.status(200).json({ success: true, data: {} });
});

// CLASS CRUD
// CLASS CRUD OPERATIONS

// @desc    Get all classes
// @route   GET /api/admin/classes
// @access  Private/Admin
exports.getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().populate('enrolledMembers', 'name email');
  res.status(200).json({ success: true, data: classes });
});

// @desc    Create a class
// @route   POST /api/admin/classes
// @access  Private/Admin
exports.createClass = asyncHandler(async (req, res) => {
  const { name, description, schedule, duration, capacity, instructor } = req.body;

  // Validation
  if (!name || !schedule || !duration || !capacity || !instructor) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  const newClass = await Class.create({
    name,
    description,
    schedule: new Date(schedule),
    duration: Number(duration),
    capacity: Number(capacity),
    instructor,
    enrolledMembers: []
  });

  res.status(201).json({ success: true, data: newClass });
});

// @desc    Update a class
// @route   PUT /api/admin/classes/:id
// @access  Private/Admin
exports.updateClass = asyncHandler(async (req, res) => {
  const { name, description, schedule, duration, capacity, instructor } = req.body;

  const updatedClass = await Class.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      schedule: new Date(schedule),
      duration: Number(duration),
      capacity: Number(capacity),
      instructor
    },
    { new: true, runValidators: true }
  );

  if (!updatedClass) {
    return res.status(404).json({ 
      success: false, 
      message: 'Class not found' 
    });
  }

  res.status(200).json({ success: true, data: updatedClass });
});

// @desc    Delete a class
// @route   DELETE /api/admin/classes/:id
// @access  Private/Admin
exports.deleteClass = asyncHandler(async (req, res) => {
  const deletedClass = await Class.findByIdAndDelete(req.params.id);

  if (!deletedClass) {
    return res.status(404).json({ 
      success: false, 
      message: 'Class not found' 
    });
  }

  res.status(200).json({ success: true, data: {} });
});

exports.getWorkoutPlans = asyncHandler(async (req, res) => {
  const plans = await WorkoutPlan.find()
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name');
  
  res.status(200).json({ 
    success: true, 
    data: plans 
  });
});


exports.uploadWorkoutPlan = asyncHandler(async (req, res, next) => {
  try {
    // 1. Validate required fields
    if (!req.file) {
      return next(new ErrorResponse('PDF file is required', 400));
    }

    if (!req.body.assignedTo) {
      return next(new ErrorResponse('Member ID is required', 400));
    }

    // 2. Verify member exists
    const member = await User.findById(req.body.assignedTo);
    if (!member || member.role !== 'member') {
      return next(new ErrorResponse('Invalid member ID', 400));
    }

    // 3. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      folder: 'workout_plans',
      format: 'pdf'
    });

    // 4. Create workout plan
    const workoutPlan = await WorkoutPlan.create({
      title: req.body.title,
      description: req.body.description,
      file: result.secure_url,
      assignedTo: req.body.assignedTo,
      assignedBy: req.user.id
    });

    // 5. Return populated response
    const populatedPlan = await WorkoutPlan.findById(workoutPlan._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedPlan
    });

  } catch (err) {
    console.error('Error in uploadWorkoutPlan:', err);
    
    // Delete uploaded file if plan creation failed
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    next(new ErrorResponse('Failed to create workout plan. Please try again.', 500));
  }
});

exports.updateWorkoutPlan = asyncHandler(async (req, res, next) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return next(new ErrorResponse('Workout plan ID is required', 400));
    }

    let updateData = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo
    };

    // Handle file upload if present
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw',
        folder: 'workout_plans'
      });
      updateData.file = result.secure_url;
    }

    const updatedPlan = await WorkoutPlan.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email');

    if (!updatedPlan) {
      return next(new ErrorResponse('Workout plan not found', 404));
    }

    res.status(200).json({
      success: true,
      data: updatedPlan
    });

  } catch (err) {
    console.error('Update error:', err);
    next(new ErrorResponse('Failed to update workout plan', 500));
  }
});

// @desc    Delete workout plan
// @route   DELETE /api/admin/workout-plans/:id
// @access  Private/Admin
exports.deleteWorkoutPlan = asyncHandler(async (req, res, next) => {
  const workoutPlan = await WorkoutPlan.findById(req.params.id);

  if (!workoutPlan) {
    return next(new ErrorResponse(`Workout plan not found with id ${req.params.id}`, 404));
  }

  // Remove associated file
  if (workoutPlan.file) {
    const filePath = `${process.env.FILE_UPLOAD_PATH}/${workoutPlan.file}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await workoutPlan.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Dashboard stats
// Dashboard stats
// In your adminController.js
exports.getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const [membersCount, classesCount, plansCount] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      Class.countDocuments(),
      WorkoutPlan.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {  // Add this nested structure
          membersCount,
          classesCount, 
          plansCount
        }
      }
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});
exports.createWorkoutPlan = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;

    // File upload (to Cloudinary)
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const uploaded = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw'
    });

    const plan = await WorkoutPlan.create({
      title,
      description,
      assignedTo,
      file: uploaded.secure_url,
      assignedDate: new Date()
    });

    res.status(201).json({ data: plan });
  } catch (error) {
    console.error('Workout plan creation error:', error);
    res.status(500).json({ message: 'Server error creating workout plan' });
  }
};
// Get all members
exports.getAllMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'member' }).select('name email');
  res.status(200).json({ success: true, data: members });
});


