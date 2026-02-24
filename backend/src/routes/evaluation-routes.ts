import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation-controller';
import { requireAuth, requireRole } from '../middleware/auth-guard';

export const evaluationRouter = Router();

evaluationRouter.patch('/:ideaId/status', requireAuth, requireRole('evaluator_admin'), evaluationController.updateStatus);
