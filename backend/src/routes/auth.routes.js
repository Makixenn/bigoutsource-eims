import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { changePasswordValidator, forgotPasswordValidator, loginValidator, registerValidator, resetPasswordValidator, setupPasswordValidator } from '../utils/auth.validator.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased temporarily for POC so the IT team doesn't get blocked
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

router.post('/check-email', AuthController.checkEmail);
router.post('/register', validate(registerValidator), AuthController.register);
router.post('/login', loginLimiter, validate(loginValidator), AuthController.login);
router.post('/login/mfa', loginLimiter, AuthController.loginMfa);
router.post('/login/mfa/resend', loginLimiter, AuthController.resendLoginMfa);
router.get('/internal-departments', AuthController.internalDepartments);
router.post('/refresh', AuthController.refreshSession);
router.get('/me', authenticate, AuthController.me);
router.put('/me', authenticate, AuthController.updateMe);
router.post('/logout', authenticate, AuthController.logout);
router.put('/password', authenticate, validate(changePasswordValidator), AuthController.changePassword);

router.get('/setup-password/verify', AuthController.verifySetupPasswordToken);
router.post('/setup-password', validate(setupPasswordValidator), AuthController.setupPassword);

router.post('/forgot-password', loginLimiter, validate(forgotPasswordValidator), AuthController.forgotPassword);
router.get('/reset-password/verify', AuthController.verifyResetPasswordToken);
router.post('/reset-password', loginLimiter, validate(resetPasswordValidator), AuthController.resetPassword);

export default router;

