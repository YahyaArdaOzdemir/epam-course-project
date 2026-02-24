import { Router } from 'express';
import { authController } from '../controllers/auth-controller';
import { requireAuth } from '../middleware/auth-guard';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', requireAuth, authController.logout);
