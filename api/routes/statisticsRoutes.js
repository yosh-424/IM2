/**
 * Statistics Routes
 * Handles all analytics and statistics endpoints
 */

import express from 'express';

// Helper function to get week number (consistent across all routes)
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const diff = d - yearStart;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
};

export const createStatisticsRoutes = (models) => {
  const router = express.Router();
  const { VisitLog, Visitor, College } = models;

  // Daily visitor count
  router.get('/daily', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await VisitLog.aggregate([
        {
          $match: {
            checkInTime: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, count: { $addToSet: '$visitorId' } } },
        { $project: { count: { $size: '$count' } } },
      ]);

      const count = result.length > 0 ? result[0].count : 0;

      return res.json({
        success: true,
        period: 'Today',
        count,
        data: { visitors: count },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Weekly visitor count
  router.get('/weekly', async (req, res) => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start from Sunday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const result = await VisitLog.aggregate([
        {
          $match: {
            checkInTime: { $gte: weekStart, $lt: weekEnd },
          },
        },
        { $group: { _id: null, count: { $addToSet: '$visitorId' } } },
        { $project: { count: { $size: '$count' } } },
      ]);

      const count = result.length > 0 ? result[0].count : 0;

      return res.json({
        success: true,
        period: 'This Week',
        count,
        data: { visitors: count },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Monthly visitor count
  router.get('/monthly', async (req, res) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const result = await VisitLog.aggregate([
        {
          $match: {
            checkInTime: { $gte: monthStart, $lt: monthEnd },
          },
        },
        { $group: { _id: null, count: { $addToSet: '$visitorId' } } },
        { $project: { count: { $size: '$count' } } },
      ]);

      const count = result.length > 0 ? result[0].count : 0;

      return res.json({
        success: true,
        period: 'This Month',
        count,
        data: { visitors: count },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Visitors by college
  router.get('/by-college', async (req, res) => {
    try {
      const colleges = await VisitLog.aggregate([
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            count: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            college: 1,
            count: { $size: '$count' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const total = colleges.reduce((sum, c) => sum + c.count, 0);
      const collegesWithPercentage = colleges.map(c => ({
        college: c.college,
        count: c.count,
        percentage: ((c.count / total) * 100).toFixed(2),
      }));

      return res.json({
        success: true,
        data: collegesWithPercentage,
        total,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Daily visitors by college
  router.get('/by-college/daily', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const stats = await VisitLog.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            count: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            college: 1,
            count: { $size: '$count' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'Today',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Weekly visitors by college
  router.get('/by-college/weekly', async (req, res) => {
    try {
      const now = new Date();
      const week = getWeekNumber(now);
      const year = now.getFullYear();

      const stats = await VisitLog.aggregate([
        { $match: { week, year } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            count: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            college: 1,
            count: { $size: '$count' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'This Week',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Monthly visitors by college
  router.get('/by-college/monthly', async (req, res) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const stats = await VisitLog.aggregate([
        { $match: { month, year } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            count: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            college: 1,
            count: { $size: '$count' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'This Month',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * ADMIN ENDPOINTS - Advanced filtering statistics
   */

  /**
   * Get filtered statistics by period and optional filters
   * Query params: period (day|week|range), startDate, endDate, college, purpose, isEmployee
   * GET /api/statistics/admin/filtered
   */
  router.get('/admin/filtered', async (req, res) => {
    try {
      const { period = 'day', startDate, endDate, college, purpose, isEmployee } = req.query;
      let matchStage = {};

      // Handle date filtering
      if (period === 'day') {
        const today = new Date().toISOString().split('T')[0];
        matchStage.date = today;
      } else if (period === 'week') {
        const now = new Date();
        const week = getWeekNumber(now);
        const year = now.getFullYear();
        matchStage.week = week;
        matchStage.year = year;
      } else if (period === 'range' && startDate && endDate) {
        matchStage.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Apply optional filters
      if (college && college !== 'all') {
        matchStage.college = college;
      }
      if (purpose && purpose !== 'all') {
        matchStage.visitPurpose = purpose;
      }
      if (isEmployee !== undefined && isEmployee !== 'all') {
        matchStage.isEmployee = isEmployee === 'true';
      }

      const results = await VisitLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $project: {
            _id: 0,
            totalVisits: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
      ]);

      const data = results.length > 0 ? results[0] : {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
      };

      return res.json({
        success: true,
        period,
        filters: { college, purpose, isEmployee },
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get statistics grouped by college with filters
   * Query params: period (day|week|range), startDate, endDate, purpose, isEmployee
   * GET /api/statistics/admin/by-college
   */
  router.get('/admin/by-college', async (req, res) => {
    try {
      const { period = 'day', startDate, endDate, purpose, isEmployee } = req.query;
      let matchStage = {};

      // Handle date filtering
      if (period === 'day') {
        const today = new Date().toISOString().split('T')[0];
        matchStage.date = today;
      } else if (period === 'week') {
        const now = new Date();
        const week = getWeekNumber(now);
        const year = now.getFullYear();
        matchStage.week = week;
        matchStage.year = year;
      } else if (period === 'range' && startDate && endDate) {
        matchStage.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Apply optional filters
      if (purpose && purpose !== 'all') {
        matchStage.visitPurpose = purpose;
      }
      if (isEmployee !== undefined && isEmployee !== 'all') {
        matchStage.isEmployee = isEmployee === 'true';
      }

      const results = await VisitLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            totalVisits: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $project: {
            _id: 0,
            college: 1,
            totalVisits: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
        { $sort: { uniqueVisitors: -1 } },
      ]);

      return res.json({
        success: true,
        period,
        filters: { purpose, isEmployee },
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get statistics grouped by visit purpose with filters
   * Query params: period (day|week|range), startDate, endDate, college, isEmployee
   * GET /api/statistics/admin/by-purpose
   */
  router.get('/admin/by-purpose', async (req, res) => {
    try {
      const { period = 'day', startDate, endDate, college, isEmployee } = req.query;
      let matchStage = {};

      // Handle date filtering
      if (period === 'day') {
        const today = new Date().toISOString().split('T')[0];
        matchStage.date = today;
      } else if (period === 'week') {
        const now = new Date();
        const week = getWeekNumber(now);
        const year = now.getFullYear();
        matchStage.week = week;
        matchStage.year = year;
      } else if (period === 'range' && startDate && endDate) {
        matchStage.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Apply optional filters
      if (college && college !== 'all') {
        matchStage.college = college;
      }
      if (isEmployee !== undefined && isEmployee !== 'all') {
        matchStage.isEmployee = isEmployee === 'true';
      }

      const results = await VisitLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$visitPurpose',
            purpose: { $first: '$visitPurpose' },
            totalVisits: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $project: {
            _id: 0,
            purpose: 1,
            totalVisits: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
        { $sort: { uniqueVisitors: -1 } },
      ]);

      return res.json({
        success: true,
        period,
        filters: { college, isEmployee },
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get statistics grouped by employee status with filters
   * Query params: period (day|week|range), startDate, endDate, college, purpose
   * GET /api/statistics/admin/by-employee-status
   */
  router.get('/admin/by-employee-status', async (req, res) => {
    try {
      const { period = 'day', startDate, endDate, college, purpose } = req.query;
      let matchStage = {};

      // Handle date filtering
      if (period === 'day') {
        const today = new Date().toISOString().split('T')[0];
        matchStage.date = today;
      } else if (period === 'week') {
        const now = new Date();
        const week = getWeekNumber(now);
        const year = now.getFullYear();
        matchStage.week = week;
        matchStage.year = year;
      } else if (period === 'range' && startDate && endDate) {
        matchStage.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Apply optional filters
      if (college && college !== 'all') {
        matchStage.college = college;
      }
      if (purpose && purpose !== 'all') {
        matchStage.visitPurpose = purpose;
      }

      const results = await VisitLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$isEmployee',
            type: {
              $cond: [{ $eq: ['$isEmployee', true] }, 'Employee', 'Student'],
            },
            totalVisits: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $project: {
            _id: 0,
            type: 1,
            totalVisits: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
        { $sort: { uniqueVisitors: -1 } },
      ]);

      return res.json({
        success: true,
        period,
        filters: { college, purpose },
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get available filter options (colleges, purposes)
   * GET /api/statistics/admin/filter-options
   */
  router.get('/admin/filter-options', async (req, res) => {
    try {
      const colleges = await VisitLog.distinct('college');
      const purposes = await VisitLog.distinct('visitPurpose');

      return res.json({
        success: true,
        data: {
          colleges: colleges.sort(),
          purposes: purposes.sort(),
          employeeTypes: ['student', 'employee'],
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
   * Get top colleges by visitor count - Daily
   * GET /api/statistics/top-colleges/daily
   */
  router.get('/top-colleges/daily', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const stats = await VisitLog.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            visitCount: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            _id: 0,
            college: 1,
            visitCount: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
          },
        },
        { $sort: { visitCount: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'Daily',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get top colleges by visitor count - Weekly
   * GET /api/statistics/top-colleges/weekly
   */
  router.get('/top-colleges/weekly', async (req, res) => {
    try {
      const now = new Date();
      const week = getWeekNumber(now);
      const year = now.getFullYear();
      
      const stats = await VisitLog.aggregate([
        { $match: { week, year } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            visitCount: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            _id: 0,
            college: 1,
            visitCount: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
          },
        },
        { $sort: { visitCount: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'Weekly',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Get top colleges by visitor count - Monthly
   * GET /api/statistics/top-colleges/monthly
   */
  router.get('/top-colleges/monthly', async (req, res) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const stats = await VisitLog.aggregate([
        { $match: { month, year } },
        {
          $group: {
            _id: '$college',
            college: { $first: '$college' },
            visitCount: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$visitorId' },
          },
        },
        {
          $project: {
            _id: 0,
            college: 1,
            visitCount: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
          },
        },
        { $sort: { visitCount: -1 } },
      ]);

      return res.json({
        success: true,
        period: 'Monthly',
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  /**
   * Search visitors with filters
   * GET /api/statistics/search-visitors?search=query&date=YYYY-MM-DD&college=collegeCode
   */
  router.get('/search-visitors', async (req, res) => {
    try {
      const { search, date, college } = req.query;
      let matchStage = {};

      // Date filtering - Treat "all" or empty string as "show all dates"
      if (date && date !== '' && date !== 'null' && date !== 'all') {
        matchStage.date = date;
      }
      
      // College filtering - Treat "all" or empty string as "show all colleges"
      if (college && college !== 'all' && college !== 'undefined' && college !== '') {
        const collegeDoc = await models.College.findOne({ 
          $or: [
            { code: new RegExp(`^${college}$`, 'i') },
            { name: new RegExp(`^${college}$`, 'i') }
          ]
        });
        
        if (collegeDoc) {
          matchStage.college = collegeDoc.name;
        } else {
          matchStage.college = new RegExp(college, 'i');
        }
      }

      // Get logs matching the filter
      let logs = await VisitLog.find(matchStage)
        .populate('visitorId', 'email firstName lastName studentNumber blocked')
        .sort({ checkInTime: -1 });

      // Smart search: match across all fields
      if (search) {
        const searchLower = search.toLowerCase().trim();

        // Build college abbreviation map for smart matching
        const allColleges = await models.College.find({}).lean();
        const matchedCollegeNames = new Set();
        for (const c of allColleges) {
          if (
            c.code?.toLowerCase().includes(searchLower) ||
            c.name?.toLowerCase().includes(searchLower)
          ) {
            matchedCollegeNames.add(c.name.toLowerCase());
          }
        }

        logs = logs.filter(log => {
          const visitor = log.visitorId;
          const email = visitor?.email?.toLowerCase() || '';
          const firstName = visitor?.firstName?.toLowerCase() || '';
          const lastName = visitor?.lastName?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`;
          const studentNumber = (log.studentNumber || visitor?.studentNumber || '').toLowerCase();
          const collegeName = log.college?.toLowerCase() || '';
          const reason = log.visitPurpose?.toLowerCase() || '';
          const checkInStr = log.checkInTime
            ? new Date(log.checkInTime).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
              }).toLowerCase()
            : '';
          const dateStr = log.date || '';

          return (
            email.includes(searchLower) ||
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            fullName.includes(searchLower) ||
            studentNumber.includes(searchLower) ||
            collegeName.includes(searchLower) ||
            matchedCollegeNames.has(collegeName) ||
            reason.includes(searchLower) ||
            checkInStr.includes(searchLower) ||
            dateStr.includes(searchLower)
          );
        });
      }

      const formattedLogs = logs.map(log => ({
        id: log.visitorId?._id || log._id,
        email: log.visitorId?.email || 'Unknown',
        studentNumber: log.studentNumber || log.visitorId?.studentNumber || 'N/A',
        firstName: log.visitorId?.firstName || 'Unknown',
        lastName: log.visitorId?.lastName || 'User',
        checkInTime: log.checkInTime,
        visitPurpose: log.visitPurpose,
        college: log.college,
        isEmployee: log.isEmployee,
        blocked: log.visitorId?.blocked || false,
      }));

      return res.json({
        success: true,
        count: formattedLogs.length,
        filters: { search, date, college },
        data: formattedLogs,
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return router;
};
