import { Router } from 'express';
import { authRouter } from './auth-routes';
import { ideaRouter } from './idea-routes';
import { evaluationRouter } from './evaluation-routes';

export const apiRouter = Router();

apiRouter.get('/health', (_request, response) => {
  response.status(200).json({ ok: true });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/ideas', ideaRouter);
apiRouter.use('/ideas', evaluationRouter);
