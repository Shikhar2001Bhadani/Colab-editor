import express from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', validateRegistration, handleValidationErrors, registerUser);
router.post('/login', validateLogin, handleValidationErrors, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);

export default router;

