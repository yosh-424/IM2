/**
 * Visit Logs Routes
 * Handles fetching visitor check-in logs by date
 */

import express from 'express';

export const createVisitLogsRoutes = (models) => {
  const router = express.Router();
  const { VisitLog, Visitor } = models;

  /**
   * Get visit logs by date
   * GET /api/visit-logs?date=YYYY-MM-DD
   * Returns all check-ins for the specified date
   */
  router.get('/', async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (format: YYYY-MM-DD)',
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      // Parse date to create range for the entire day
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59Z`);

      // Fetch visit logs for the date
      const logs = await VisitLog.find({
        checkInTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
        .populate('visitorId', 'email firstName lastName')
        .sort({ checkInTime: -1 })
        .lean();

      // Format response
      const formattedLogs = logs.map(log => ({
        id: log._id,
        email: log.visitorId?.email || 'Unknown',
        studentNumber: log.studentNumber || 'N/A',
        firstName: log.visitorId?.firstName || 'Unknown',
        lastName: log.visitorId?.lastName || 'User',
        checkInTime: log.checkInTime,
        visitPurpose: log.visitPurpose || 'General Visit',
        isEmployee: log.isEmployee,
        college: log.college || 'N/A',
      }));

      return res.json({
        success: true,
        date,
        count: formattedLogs.length,
        data: formattedLogs,
      });
    } catch (error) {
      console.error('Visit logs fetch error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get visit logs by date range
   * GET /api/visit-logs/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Returns all check-ins between the specified dates
   */
  router.get('/range', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Both startDate and endDate query parameters are required',
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
      }

      const start = new Date(`${startDate}T00:00:00Z`);
      const end = new Date(`${endDate}T23:59:59Z`);

      const logs = await VisitLog.find({
        checkInTime: {
          $gte: start,
          $lte: end,
        },
      })
        .populate('visitorId', 'email firstName lastName')
        .sort({ checkInTime: -1 })
        .lean();

      const formattedLogs = logs.map(log => ({
        id: log._id,
        email: log.visitorId?.email || 'Unknown',
        firstName: log.visitorId?.firstName || 'Unknown',
        lastName: log.visitorId?.lastName || 'User',
        checkInTime: log.checkInTime,
        visitPurpose: log.visitPurpose || 'General Visit',
        isEmployee: log.isEmployee,
        college: log.college || 'N/A',
      }));

      return res.json({
        success: true,
        startDate,
        endDate,
        count: formattedLogs.length,
        data: formattedLogs,
      });
    } catch (error) {
      console.error('Visit logs range fetch error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
};
