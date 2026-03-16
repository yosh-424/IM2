/**
 * Admin Management Routes
 * Handles admin operations like blocking/unblocking visitors
 */

import express from 'express';

export const createAdminRoutes = (models) => {
  const router = express.Router();
  const { Visitor, VisitLog } = models;

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

  return router;
};
