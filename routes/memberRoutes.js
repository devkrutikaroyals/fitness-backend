// routes/member.js
const express = require('express');
const ctrl = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all available classes for members
router.get('/classes', ctrl.getAvailableClasses);

// Get member's enrolled classes
router.get('/my-classes', ctrl.getMyClasses);

// Enroll in a class
router.put('/classes/:id/enroll', ctrl.enrollInClass);

module.exports = router;
