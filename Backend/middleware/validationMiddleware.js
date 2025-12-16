const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware untuk validasi input umum
 */

// Validation untuk product input
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Product name must be 3-255 characters')
    .matches(/^[a-zA-Z0-9\s\-.,()&]+$/).withMessage('Product name contains invalid characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 999999999 }).withMessage('Price must be a positive number and less than 1 billion')
    .toFloat(),
  
  body('stock_quantity')
    .optional()
    .isInt({ min: 0, max: 999999 }).withMessage('Stock quantity must be a non-negative integer and less than 1 million')
    .toInt(),
  
  body('weight_gram')
    .optional()
    .isInt({ min: 0, max: 1000000 }).withMessage('Weight must be a non-negative integer in grams')
    .toInt(),
  
  body('category_id')
    .notEmpty().withMessage('Category ID is required')
    .isInt({ min: 1 }).withMessage('Category ID must be a valid positive integer')
    .toInt(),
];

// Validation untuk cart operations
const validateCartItem = [
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a valid positive integer')
    .toInt(),
  
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999')
    .toInt(),
  
  body('sku_id')
    .optional()
    .isInt({ min: 1 }).withMessage('SKU ID must be a valid positive integer')
    .toInt(),
];

// Validation untuk update cart item
const validateUpdateCartItem = [
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999')
    .toInt(),
  
  body('is_selected')
    .optional()
    .isBoolean().withMessage('is_selected must be a boolean')
    .toBoolean(),
];

// Validation untuk password
const validatePassword = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
];

// Validation untuk email
const validateEmail = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
];

// Validation untuk phone number
const validatePhone = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Invalid Indonesian phone number format'),
];

// Validation untuk register
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Full name contains invalid characters'),
  ...validateEmail,
  ...validatePhone,
  ...validatePassword,
];

// Validation untuk voucher code
const validateVoucherCode = [
  body('code')
    .trim()
    .notEmpty().withMessage('Voucher code is required')
    .isLength({ min: 3, max: 50 }).withMessage('Voucher code must be 3-50 characters')
    .matches(/^[A-Z0-9\-_]+$/).withMessage('Voucher code must be uppercase letters, numbers, hyphens, or underscores only'),
];

// Validation untuk address
const validateAddress = [
  body('label')
    .trim()
    .notEmpty().withMessage('Address label is required')
    .isLength({ min: 2, max: 50 }).withMessage('Label must be 2-50 characters'),
  
  body('recipient_name')
    .trim()
    .notEmpty().withMessage('Recipient name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Recipient name must be 2-100 characters'),
  
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Invalid Indonesian phone number format'),
  
  body('address_line')
    .trim()
    .notEmpty().withMessage('Address line is required')
    .isLength({ min: 10, max: 500 }).withMessage('Address must be 10-500 characters'),
  
  body('province')
    .trim()
    .notEmpty().withMessage('Province is required'),
  
  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('postal_code')
    .optional()
    .matches(/^[0-9]{5}$/).withMessage('Postal code must be 5 digits'),
];

// Validation untuk order status
const validateOrderStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
];

// Validation untuk pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];

// Validation untuk price range
const validatePriceRange = [
  query('min_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be non-negative')
    .toFloat(),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be non-negative')
    .toFloat(),
];

// Validation untuk ID params
const validateIdParam = (paramName = 'id') => [
  param(paramName)
    .notEmpty().withMessage(`${paramName} is required`)
    .isInt({ min: 1 }).withMessage(`${paramName} must be a valid positive integer`)
    .toInt(),
];

// Middleware untuk handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitization middleware untuk mencegah XSS
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove script tags and dangerous HTML
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  next();
};

module.exports = {
  validateProduct,
  validateCartItem,
  validateUpdateCartItem,
  validatePassword,
  validateEmail,
  validatePhone,
  validateRegister,
  validateVoucherCode,
  validateAddress,
  validateOrderStatus,
  validatePagination,
  validatePriceRange,
  validateIdParam,
  handleValidationErrors,
  sanitizeInput,
};
