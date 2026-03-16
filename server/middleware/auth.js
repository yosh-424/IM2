/**
 * Authorization Middleware
 * Checks user roles and permissions
 */

/**
 * Check if user is admin
 * Usage: router.get('/admin-endpoint', requireAdmin, controllerFunction)
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // In a real application, you would get user info from session/JWT token
    // For now, we check a header or query parameter
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User ID required',
      });
    }

    // Store user info in request for later use
    req.userId = userId;
    req.userRole = req.headers['x-user-role'] || req.query.role || 'user';

    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check if user is authenticated
 * Usage: router.get('/protected-endpoint', requireAuth, controllerFunction)
 */
export const requireAuth = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User ID required',
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
