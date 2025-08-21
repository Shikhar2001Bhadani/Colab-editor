import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors from express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('username', 'Username is required').not().isEmpty().trim().escape(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
];

// Validation rules for user login
const validateLogin = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists(),
];

// Validation rules for sharing a document
const validateShare = [
    body('email', 'Please include a valid email for the collaborator').isEmail().normalizeEmail(),
    body('role', 'Role must be either viewer or editor').isIn(['viewer', 'editor']),
];

export {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateShare,
};