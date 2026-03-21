/**
 * Visitor Routes
 * Handles all visitor-related API endpoints
 */

import express from 'express';

export const createVisitorRoutes = (models) => {
  const router = express.Router();
  const { Visitor, College, VisitLog } = models;

  // Add new visitor
  router.post('/', async (req, res) => {
    try {
      const { email, firstName, lastName, collegeId } = req.body;
      
      const visitor = await Visitor.create({
        email,
        firstName,
        lastName,
        collegeId,
      });

      return res.status(201).json({
        success: true,
        message: 'Visitor added successfully',
        data: visitor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // List all visitors with pagination
  router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const count = await Visitor.countDocuments();
      const rows = await Visitor.find()
        .populate('collegeId')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Get specific visitor details
  router.get('/:id', async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id)
        .populate('collegeId')
        .populate('visitLogs');

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      return res.json({
        success: true,
        data: visitor,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Check-in visitor
  router.post('/:id/check-in', async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);
      
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      const college = await College.findById(visitor.collegeId);
      const now = new Date();
      
      const visitLog = await VisitLog.create({
        visitorId: visitor._id,
        email: visitor.email,
        studentNumber: visitor.studentNumber,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        checkInTime: now,
        date: now.toISOString().split('T')[0],
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        college: college.name,
        visitPurpose: visitor.visitPurpose || 'General Visit',
        isEmployee: visitor.isEmployee,
      });

      visitor.totalVisits += 1;
      await visitor.save();

      return res.status(200).json({
        success: true,
        message: 'Checked in successfully',
        data: visitLog,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Check-out visitor
  router.post('/:id/check-out', async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);
      
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      const now = new Date();
      const lastVisit = await VisitLog.findOne({ 
        visitorId: visitor._id, 
        checkOutTime: null 
      }).sort({ checkInTime: -1 });

      if (!lastVisit) {
        return res.status(400).json({
          success: false,
          message: 'No active check-in found',
        });
      }

      const checkInTime = new Date(lastVisit.checkInTime);
      const duration = Math.floor((now - checkInTime) / 60000); // minutes

      lastVisit.checkOutTime = now;
      lastVisit.duration = duration;
      await lastVisit.save();

      return res.json({
        success: true,
        message: 'Checked out successfully',
        data: lastVisit,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Update visitor
  router.put('/:id', async (req, res) => {
    try {
      const visitor = await Visitor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      return res.json({
        success: true,
        message: 'Visitor updated successfully',
        data: visitor,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Delete visitor
  router.delete('/:id', async (req, res) => {
    try {
      const visitor = await Visitor.findByIdAndDelete(req.params.id);
      
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      return res.json({
        success: true,
        message: 'Visitor deleted successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
};

// Helper function to get week number (consistent across all routes)
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const diff = d - yearStart;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}

