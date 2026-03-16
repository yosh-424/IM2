/**
 * Authentication Routes
 * Handles user login, admin login, and session management
 */

import express from 'express';

const ADMIN_PASSWORD = '0000'; // Admin password

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const diff = d - yearStart;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
};

export const createAuthRoutes = (models) => {
  const router = express.Router();
  const { Visitor, VisitLog } = models;

  /**
   * User Login endpoint
   * Validates user email and visit reason, creates check-in record
   * POST /api/auth/user-login
   * Body: { email: string, visitReason: string, collegeId: string }
   */
  router.post('/user-login', async (req, res) => {
    try {
      const { email, visitReason, collegeId } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Validate institutional email
      const neuEmailRegex = /.+@neu\.edu\.ph$/i;
      if (!neuEmailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'You must enter your NEU institutional email (@neu.edu.ph)',
        });
      }

      if (!visitReason || !visitReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason for visiting',
        });
      }

      if (!collegeId || !collegeId.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please select a college',
        });
      }

      // Find or create visitor
      let visitor = await Visitor.findOne({ email: email.toLowerCase() })
        .populate('collegeId');

      if (!visitor) {
        // Create new visitor
        visitor = await Visitor.create({
          email: email.toLowerCase(),
          firstName: email.split('@')[0].split('.')[0] || 'User',
          lastName: email.split('@')[0].split('.')[1] || 'NEU',
          collegeId: collegeId,
          visitPurpose: visitReason.trim(),
          role: 'user',
          isEmployee: false,
        }).then(v => v.populate('collegeId'));
      } else {
        // Check if visitor is blocked
        if (visitor.blocked) {
          return res.status(403).json({
            success: false,
            message: `Access denied. ${visitor.blockedReason || 'You have been blocked from checking in.'}`,
          });
        }
        
        // Update visit purpose and college if changed
        visitor.visitPurpose = visitReason.trim();
        visitor.collegeId = collegeId;
        await visitor.save();
        // Re-populate collegeId to get the college name for the visit log
        visitor = await Visitor.findById(visitor._id).populate('collegeId');
      }

      // Create visit log
      const now = new Date();
      const visitLog = await VisitLog.create({
        visitorId: visitor._id,
        email: visitor.email,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        checkInTime: now,
        date: now.toISOString().split('T')[0],
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        college: visitor.collegeId?.name || 'N/A',
        visitPurpose: visitReason.trim(),
        isEmployee: visitor.isEmployee,
      });

      // Increment total visits
      visitor.totalVisits += 1;
      await visitor.save();

      // Prepare user session data
      const userData = {
        id: visitor._id,
        email: visitor.email,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        college: visitor.collegeId?.name || 'N/A',
        visitReason: visitReason.trim(),
        totalVisits: visitor.totalVisits,
        role: 'visitor',
      };

      return res.json({
        success: true,
        message: 'Welcome to the NEU Library!',
        data: userData,
      });
    } catch (error) {
      console.error('User login error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Admin Login endpoint
   * Validates admin credentials
   * POST /api/auth/admin-login
   * Body: { email: string, password: string }
   */
  router.post('/admin-login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Validate institutional email
      const neuEmailRegex = /.+@neu\.edu\.ph$/i;
      if (!neuEmailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'You must enter your NEU institutional email (@neu.edu.ph)',
        });
      }

      // Check if email is authorized admin
      const authorizedAdmins = ['jcesperanza@neu.edu.ph', 'joshuaandre.tindoy@neu.edu.ph'];
      if (!authorizedAdmins.includes(email.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access the admin panel',
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Admin password is required',
        });
      }

      // Validate password
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin password',
        });
      }

      // Find or create admin user
      let admin = await Visitor.findOne({ email: email.toLowerCase() })
        .populate('collegeId');

      if (!admin) {
        // Create new admin
        const defaultCollegeId = '507f1f77bcf86cd799439012'; // Replace with actual college ID from DB
        admin = await Visitor.create({
          email: email.toLowerCase(),
          firstName: email.split('@')[0].split('.')[0] || 'Admin',
          lastName: email.split('@')[0].split('.')[1] || 'User',
          collegeId: defaultCollegeId,
          role: 'admin',
          isEmployee: true,
        }).then(v => v.populate('collegeId'));
      } else {
        // Update to admin role
        admin.role = 'admin';
        await admin.save();
      }

      // Prepare admin session data
      const adminData = {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        college: admin.collegeId?.name || 'N/A',
        role: 'admin',
        isEmployee: true,
      };

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: adminData,
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get current user info
   * GET /api/auth/user/:id
   */
  router.get('/user/:id', async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id)
        .populate('collegeId');

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userData = {
        id: visitor._id,
        email: visitor.email,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        college: visitor.collegeId?.name || 'N/A',
        role: visitor.role,
        isEmployee: visitor.isEmployee,
        totalVisits: visitor.totalVisits,
      };

      return res.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Switch user role (for demo purposes - in production, this would be admin-only)
   * POST /api/auth/switch-role
   * Body: { userId: string, role: 'user' | 'admin' }
   */
  router.post('/switch-role', async (req, res) => {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({
          success: false,
          message: 'userId and role are required',
        });
      }

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be "user" or "admin"',
        });
      }

      const visitor = await Visitor.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).populate('collegeId');

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userData = {
        id: visitor._id,
        email: visitor.email,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        college: visitor.collegeId?.name || 'N/A',
        role: visitor.role,
        isEmployee: visitor.isEmployee,
        totalVisits: visitor.totalVisits,
      };

      return res.json({
        success: true,
        message: `Role switched to ${role}`,
        data: userData,
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
