/**
 * Authentication Routes
 * Handles Google OAuth login for users and admins
 */

import express from 'express';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Default admin emails (seeded into DB on first run)
const DEFAULT_ADMIN_EMAILS = ['jcesperanza@neu.edu.ph', 'joshuaandre.tindoy@neu.edu.ph'];

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

/**
 * Verify Google ID token and return payload
 */
async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

/**
 * Seed default admin emails into the AdminEmail collection if not already present
 */
async function seedDefaultAdmins(AdminEmail) {
  for (const email of DEFAULT_ADMIN_EMAILS) {
    const exists = await AdminEmail.findOne({ email: email.toLowerCase() });
    if (!exists) {
      await AdminEmail.create({ email: email.toLowerCase(), addedBy: 'system' });
    }
  }
}

export const createAuthRoutes = (models) => {
  const router = express.Router();
  const { Visitor, VisitLog, AdminEmail, StaffEmail } = models;

  // Seed default admins on startup
  seedDefaultAdmins(AdminEmail).catch(err => console.error('Failed to seed admin emails:', err));

  /**
   * User Login via Google OAuth
   * Validates Google token, checks @neu.edu.ph
   * POST /api/auth/user-login
   * Body: { credential: string (Google ID token) }
   */
  router.post('/user-login', async (req, res) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: 'Google credential is required',
        });
      }

      // Verify Google token
      let payload;
      try {
        payload = await verifyGoogleToken(credential);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Google credential',
        });
      }

      const email = payload.email;
      const emailVerified = payload.email_verified;

      if (!emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Google email is not verified',
        });
      }

      // Validate institutional email
      const neuEmailRegex = /.+@neu\.edu\.ph$/i;
      if (!neuEmailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'You must sign in with your NEU institutional email (@neu.edu.ph)',
        });
      }

      // Extract name from Google profile
      const firstName = payload.given_name || email.split('@')[0].split('.')[0] || 'User';
      const lastName = payload.family_name || email.split('@')[0].split('.')[1] || 'NEU';

      // Find or create visitor
      let visitor = await Visitor.findOne({ email: email.toLowerCase() })
        .populate('collegeId');

      // Check if this email is registered as staff/faculty
      const isStaff = await StaffEmail.findOne({ email: email.toLowerCase() });

      if (!visitor) {
        // Get first college as temporary default
        const { College } = models;
        const defaultCollege = await College.findOne();
        const defaultCollegeId = defaultCollege?._id || '507f1f77bcf86cd799439012';

        visitor = await Visitor.create({
          email: email.toLowerCase(),
          firstName,
          lastName,
          collegeId: defaultCollegeId,
          role: 'user',
          isEmployee: !!isStaff,
          profileComplete: !!isStaff,
        }).then(v => v.populate('collegeId'));
      } else {
        if (visitor.blocked) {
          return res.status(403).json({
            success: false,
            message: `Access denied. ${visitor.blockedReason || 'You have been blocked from checking in.'}`,
          });
        }
        visitor.firstName = firstName;
        visitor.lastName = lastName;
        if (isStaff) {
          visitor.isEmployee = true;
          visitor.profileComplete = true;
        }
        await visitor.save();
        visitor = await Visitor.findById(visitor._id).populate('collegeId');
      }

      const userData = {
        id: visitor._id,
        email: visitor.email,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        studentNumber: visitor.studentNumber,
        college: visitor.collegeId?.name || 'N/A',
        collegeId: visitor.collegeId?._id,
        totalVisits: visitor.totalVisits,
        profileComplete: visitor.profileComplete,
        isEmployee: visitor.isEmployee,
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
   * Complete student profile
   * POST /api/auth/complete-profile
   * Body: { userId: string, studentNumber: string, collegeId: string }
   */
  router.post('/complete-profile', async (req, res) => {
    try {
      const { userId, studentNumber, collegeId } = req.body;

      if (!userId || !studentNumber || !collegeId) {
        return res.status(400).json({
          success: false,
          message: 'userId, studentNumber, and collegeId are required',
        });
      }

      // Validate student number format: xx-xxxxx-xxx
      const studentNumRegex = /^\d{2}-\d{5}-\d{3}$/;
      if (!studentNumRegex.test(studentNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Student number must be in the format xx-xxxxx-xxx',
        });
      }

      const visitor = await Visitor.findById(userId);
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      visitor.studentNumber = studentNumber;
      visitor.collegeId = collegeId;
      visitor.profileComplete = true;
      await visitor.save();

      const updated = await Visitor.findById(userId).populate('collegeId');

      return res.json({
        success: true,
        message: 'Profile completed successfully',
        data: {
          id: updated._id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          studentNumber: updated.studentNumber,
          college: updated.collegeId?.name || 'N/A',
          collegeId: updated.collegeId?._id,
          totalVisits: updated.totalVisits,
          profileComplete: updated.profileComplete,
          role: 'visitor',
        },
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Check in with visit reason
   * POST /api/auth/check-in
   * Body: { userId: string, visitReason: string }
   */
  router.post('/check-in', async (req, res) => {
    try {
      const { userId, visitReason } = req.body;

      if (!userId || !visitReason) {
        return res.status(400).json({
          success: false,
          message: 'userId and visitReason are required',
        });
      }

      const visitor = await Visitor.findById(userId).populate('collegeId');
      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Create visit log
      const now = new Date();
      await VisitLog.create({
        visitorId: visitor._id,
        email: visitor.email,
        studentNumber: visitor.isEmployee ? 'N/A' : visitor.studentNumber,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        checkInTime: now,
        date: now.toISOString().split('T')[0],
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        college: visitor.isEmployee ? 'Staff/Faculty' : (visitor.collegeId?.name || 'N/A'),
        visitPurpose: visitor.isEmployee ? 'Staff/Faculty' : visitReason.trim(),
        isEmployee: visitor.isEmployee,
      });

      visitor.visitPurpose = visitReason.trim();
      visitor.totalVisits += 1;
      await visitor.save();

      return res.json({
        success: true,
        message: 'Logged in successfully!',
        data: {
          id: visitor._id,
          email: visitor.email,
          firstName: visitor.firstName,
          lastName: visitor.lastName,
          studentNumber: visitor.studentNumber,
          college: visitor.collegeId?.name || 'N/A',
          visitReason: visitReason.trim(),
          totalVisits: visitor.totalVisits,
          profileComplete: visitor.profileComplete,
          role: 'visitor',
        },
      });
    } catch (error) {
      console.error('Check-in error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Admin Login via Google OAuth
   * Validates Google token, checks authorized admin email list
   * POST /api/auth/admin-login
   * Body: { credential: string (Google ID token) }
   */
  router.post('/admin-login', async (req, res) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: 'Google credential is required',
        });
      }

      // Verify Google token
      let payload;
      try {
        payload = await verifyGoogleToken(credential);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Google credential',
        });
      }

      const email = payload.email;
      const emailVerified = payload.email_verified;

      if (!emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Google email is not verified',
        });
      }

      // Check if email is an authorized admin
      const adminRecord = await AdminEmail.findOne({ email: email.toLowerCase() });
      if (!adminRecord) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access the admin panel',
        });
      }

      const firstName = payload.given_name || email.split('@')[0].split('.')[0] || 'Admin';
      const lastName = payload.family_name || email.split('@')[0].split('.')[1] || 'User';

      // Find or create admin user
      let admin = await Visitor.findOne({ email: email.toLowerCase() })
        .populate('collegeId');

      if (!admin) {
        // Get first college as default
        const { College } = models;
        const defaultCollege = await College.findOne();
        const defaultCollegeId = defaultCollege?._id || '507f1f77bcf86cd799439012';

        admin = await Visitor.create({
          email: email.toLowerCase(),
          firstName,
          lastName,
          collegeId: defaultCollegeId,
          role: 'admin',
          isEmployee: true,
        }).then(v => v.populate('collegeId'));
      } else {
        admin.firstName = firstName;
        admin.lastName = lastName;
        admin.role = 'admin';
        await admin.save();
      }

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
