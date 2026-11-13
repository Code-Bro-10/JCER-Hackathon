import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateRequiredFields, validateEmailAndPassword } from '../middleware/validation.js';

const router = express.Router();

router.post(
  '/register',
  validateRequiredFields(['name', 'email', 'password']),
  validateEmailAndPassword,
  register
);

router.post('/login', validateEmailAndPassword, login);
router.get('/me', authenticate, getMe);
router.post('/logout', optionalAuth, logout);

export default router;

