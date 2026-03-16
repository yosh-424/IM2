/**
 * Search Routes
 * Handles visitor search by email, name, or college
 */

import express from 'express';

export const createSearchRoutes = (models) => {
  const router = express.Router();
  const { Visitor, College } = models;

  // Unified search endpoint
  router.get('/', async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const searchRegex = new RegExp(query, 'i');

      const results = await Visitor.find({
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      })
        .populate('collegeId')
        .limit(10);

      return res.json({
        success: true,
        query,
        count: results.length,
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Search by email
  router.get('/email/:email', async (req, res) => {
    try {
      const visitor = await Visitor.findOne({
        email: req.params.email,
      }).populate('collegeId');

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

  // Search by name
  router.get('/name/:name', async (req, res) => {
    try {
      const searchRegex = new RegExp(req.params.name, 'i');

      const results = await Visitor.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      })
        .populate('collegeId')
        .limit(10);

      return res.json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Search by college
  router.get('/college/:collegeName', async (req, res) => {
    try {
      const searchRegex = new RegExp(req.params.collegeName, 'i');

      const colleges = await College.find({ name: searchRegex });
      const collegeIds = colleges.map(c => c._id);

      const results = await Visitor.find({
        collegeId: { $in: collegeIds },
      })
        .populate('collegeId')
        .limit(10);

      return res.json({
        success: true,
        count: results.length,
        data: results,
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
