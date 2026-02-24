import { Router } from 'express';
import { authController } from '../controllers/auth-controller';
import { requireAuth, requireCsrf } from '../middleware/auth-guard';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', requireAuth, requireCsrf, authController.logout);
authRouter.get('/session', requireAuth, authController.session);
authRouter.get('/csrf', requireAuth, authController.csrf);
authRouter.post('/password-reset/request', authController.passwordResetRequest);
authRouter.post('/password-reset/confirm', authController.passwordResetConfirm);
