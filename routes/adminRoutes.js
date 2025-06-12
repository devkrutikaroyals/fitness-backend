const express = require('express');
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const asyncHandler = require('../middleware/async'); 
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 300 });// Add this line

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, authorize('admin'));

// Dashboard
router.get('/stats', ctrl.getDashboardStats);
// Members
router.get('/members', ctrl.getMembers);
router.post('/members', ctrl.createMember);
router.put('/members/:id', ctrl.updateMember);
router.delete('/members/:id', ctrl.deleteMember);
router.get('/all-members', ctrl.getAllMembers);

// Classes
router.get('/classes', ctrl.getClasses);
router.post('/classes', ctrl.createClass);
router.put('/classes/:id', ctrl.updateClass);
router.delete('/classes/:id', ctrl.deleteClass);

// Workout Plans
router.get('/workout-plans', ctrl.getWorkoutPlans); // You were missing this GET route
router.post(
  '/workout-plans',
  upload.single('file'),
  ctrl.uploadWorkoutPlan // Use the controller directly
);
router.put(
  '/workout-plans/:id',
  upload.single('file'),
  ctrl.updateWorkoutPlan
);
router.delete('/workout-plans/:id', ctrl.deleteWorkoutPlan);

module.exports = router;