/**
 * Admin Management Routes
 * Handles admin operations like blocking/unblocking visitors and managing admin emails
 */

import express from 'express';

export const createAdminRoutes = (models) => {
  const router = express.Router();
  const { Visitor, VisitLog, AdminEmail, StaffEmail } = models;

  /**
   * Block a visitor
   * POST /api/admin/visitors/block
   * Body: { visitorId: string, reason: string }
   */
  router.post('/visitors/block', async (req, res) => {
    try {
      const { visitorId, reason } = req.body;

      if (!visitorId) {
        return res.status(400).json({
          success: false,
          message: 'visitorId is required',
        });
      }

      const visitor = await Visitor.findByIdAndUpdate(
        visitorId,
        {
          blocked: true,
          blockedReason: reason || 'Account blocked by admin',
        },
        { new: true }
      );

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      return res.json({
        success: true,
        message: `Visitor ${visitor.email} has been blocked`,
        data: visitor,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Unblock a visitor
   * POST /api/admin/visitors/unblock
   * Body: { visitorId: string }
   */
  router.post('/visitors/unblock', async (req, res) => {
    try {
      const { visitorId } = req.body;

      if (!visitorId) {
        return res.status(400).json({
          success: false,
          message: 'visitorId is required',
        });
      }

      const visitor = await Visitor.findByIdAndUpdate(
        visitorId,
        {
          blocked: false,
          blockedReason: null,
        },
        { new: true }
      );

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      return res.json({
        success: true,
        message: `Visitor ${visitor.email} has been unblocked`,
        data: visitor,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get all visitors with details
   * GET /api/admin/visitors?search=query&college=collegeName&blocked=true/false
   */
  router.get('/visitors', async (req, res) => {
    try {
      const { search, college, blocked } = req.query;
      let filter = {};

      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      if (college && college !== 'all') {
        filter.college = college;
      }

      if (blocked !== undefined) {
        filter.blocked = blocked === 'true';
      }

      const visitors = await Visitor.find(filter)
        .populate('collegeId', 'name code')
        .sort({ createdAt: -1 });

      const formattedVisitors = visitors.map(v => ({
        id: v._id,
        email: v.email,
        firstName: v.firstName,
        lastName: v.lastName,
        college: v.collegeId?.name || 'N/A',
        collegeCode: v.collegeId?.code || 'N/A',
        totalVisits: v.totalVisits,
        isEmployee: v.isEmployee,
        blocked: v.blocked,
        blockedReason: v.blockedReason,
        role: v.role,
        createdAt: v.createdAt,
      }));

      return res.json({
        success: true,
        count: formattedVisitors.length,
        data: formattedVisitors,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get visitor details by ID
   * GET /api/admin/visitors/:id
   */
  router.get('/visitors/:id', async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id)
        .populate('collegeId', 'name code');

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: 'Visitor not found',
        });
      }

      // Fetch visit logs for this visitor
      const logs = await VisitLog.find({ visitorId: visitor._id })
        .sort({ checkInTime: -1 })
        .limit(20);

      return res.json({
        success: true,
        data: {
          visitor: {
            id: visitor._id,
            email: visitor.email,
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            college: visitor.collegeId?.name || 'N/A',
            collegeCode: visitor.collegeId?.code || 'N/A',
            totalVisits: visitor.totalVisits,
            isEmployee: visitor.isEmployee,
            blocked: visitor.blocked,
            blockedReason: visitor.blockedReason,
            role: visitor.role,
            createdAt: visitor.createdAt,
          },
          recentLogs: logs,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get all admin emails
   * GET /api/admin/admin-emails
   */
  router.get('/admin-emails', async (req, res) => {
    try {
      const admins = await AdminEmail.find().sort({ createdAt: -1 });
      return res.json({
        success: true,
        data: admins.map(a => ({
          id: a._id,
          email: a.email,
          addedBy: a.addedBy,
          createdAt: a.createdAt,
        })),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Add an admin email
   * POST /api/admin/admin-emails
   * Body: { email: string, addedBy: string }
   */
  router.post('/admin-emails', async (req, res) => {
    try {
      const { email, addedBy } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const neuEmailRegex = /.+@neu\.edu\.ph$/i;
      if (!neuEmailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Only NEU institutional emails (@neu.edu.ph) can be added as admin',
        });
      }

      const existing = await AdminEmail.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This email is already an admin',
        });
      }

      const adminEmail = await AdminEmail.create({
        email: email.toLowerCase().trim(),
        addedBy: addedBy || 'admin',
      });

      return res.json({
        success: true,
        message: `${email} has been added as an admin`,
        data: {
          id: adminEmail._id,
          email: adminEmail.email,
          addedBy: adminEmail.addedBy,
          createdAt: adminEmail.createdAt,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Remove an admin email
   * DELETE /api/admin/admin-emails/:id
   */
  router.delete('/admin-emails/:id', async (req, res) => {
    try {
      const adminEmail = await AdminEmail.findById(req.params.id);

      if (!adminEmail) {
        return res.status(404).json({
          success: false,
          message: 'Admin email not found',
        });
      }

      // Prevent removing the last admin
      const adminCount = await AdminEmail.countDocuments();
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last admin. At least one admin must remain.',
        });
      }

      await AdminEmail.findByIdAndDelete(req.params.id);

      return res.json({
        success: true,
        message: `${adminEmail.email} has been removed as admin`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Reset a visitor's profile (forces re-entry of student number and college)
   * POST /api/admin/visitors/reset-profile
   * Body: { email: string }
   */
  router.post('/visitors/reset-profile', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'email is required' });
      }

      const visitor = await Visitor.findOne({ email: email.toLowerCase() });
      if (!visitor) {
        return res.status(404).json({ success: false, message: 'Visitor not found' });
      }

      visitor.studentNumber = null;
      visitor.profileComplete = false;
      await visitor.save();

      return res.json({
        success: true,
        message: `Profile for ${email} has been reset. They will be prompted to re-enter student number and college on next login.`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * Get all staff/faculty emails
   * GET /api/admin/staff-emails
   */
  router.get('/staff-emails', async (req, res) => {
    try {
      const staff = await StaffEmail.find().sort({ createdAt: -1 });
      return res.json({
        success: true,
        data: staff.map(s => ({
          id: s._id,
          email: s.email,
          addedBy: s.addedBy,
          createdAt: s.createdAt,
        })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * Add a staff/faculty email
   * POST /api/admin/staff-emails
   * Body: { email: string, addedBy: string }
   */
  router.post('/staff-emails', async (req, res) => {
    try {
      const { email, addedBy } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const neuEmailRegex = /.+@neu\.edu\.ph$/i;
      if (!neuEmailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Only NEU institutional emails (@neu.edu.ph) can be added as staff/faculty',
        });
      }

      const existing = await StaffEmail.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'This email is already registered as staff/faculty' });
      }

      const staffEmail = await StaffEmail.create({
        email: email.toLowerCase().trim(),
        addedBy: addedBy || 'admin',
      });

      // If the visitor already exists, mark them as employee
      await Visitor.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { isEmployee: true, profileComplete: true }
      );

      return res.json({
        success: true,
        message: `${email} has been added as staff/faculty`,
        data: {
          id: staffEmail._id,
          email: staffEmail.email,
          addedBy: staffEmail.addedBy,
          createdAt: staffEmail.createdAt,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  /**
   * Remove a staff/faculty email
   * DELETE /api/admin/staff-emails/:id
   */
  router.delete('/staff-emails/:id', async (req, res) => {
    try {
      const staffEmail = await StaffEmail.findById(req.params.id);

      if (!staffEmail) {
        return res.status(404).json({ success: false, message: 'Staff email not found' });
      }

      // Revert the visitor's employee status
      await Visitor.findOneAndUpdate(
        { email: staffEmail.email },
        { isEmployee: false }
      );

      await StaffEmail.findByIdAndDelete(req.params.id);

      return res.json({
        success: true,
        message: `${staffEmail.email} has been removed as staff/faculty`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
