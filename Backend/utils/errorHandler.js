const express = require('express');
const pool = require('../config/database');

/**
 * Standardized API response format
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (errors && process.env.NODE_ENV === 'development') {
    response.errors = errors;
  }
  
  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.message = 'Internal Server Error';
  }
  
  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400, err.errors);
  }
  
  if (err.name === 'UnauthorizedError' || err.message.includes('tidak terautentikasi')) {
    return sendError(res, 'Unauthorized access', 401);
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry - resource already exists', 409);
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_ROW_IS_REFERENCED') {
    return sendError(res, 'Foreign key constraint failed', 400);
  }
  
  if (err.message === 'Not allowed by CORS') {
    return sendError(res, 'CORS policy: Origin not allowed', 403);
  }
  
  // Default error response
  sendError(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

/**
 * Logging middleware for requests
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
};

/**
 * Health check for database connection
 */
const healthCheck = async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1');
    sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
    }, 'System is healthy');
  } catch (error) {
    sendError(res, 'Database connection failed', 503, { detail: error.message });
  }
};

module.exports = {
  sendSuccess,
  sendError,
  asyncHandler,
  errorHandler,
  requestLogger,
  healthCheck,
};
