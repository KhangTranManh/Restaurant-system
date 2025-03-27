// server/middleware/auth.js
const authenticateUser = (req, res, next) => {
    // For development, we'll just let all requests through
    // Later you can implement actual authentication here
    next();
  };
  
  const isAdmin = (req, res, next) => {
    // For development, we'll let all requests through to admin routes
    // Later you can check if user has admin role
    next();
  };
  
  module.exports = {
    authenticateUser,
    isAdmin
  };