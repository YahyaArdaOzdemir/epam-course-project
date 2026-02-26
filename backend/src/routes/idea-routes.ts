import { Router } from 'express';
import { ideaController } from '../controllers/idea-controller';
import { requireAuth, requireCsrf } from '../middleware/auth-guard';
import { handleSingleIdeaAttachmentUpload } from '../middleware/idea-upload-middleware';

export const ideaRouter = Router();

ideaRouter.get('/', requireAuth, ideaController.list);
ideaRouter.get('/:ideaId', requireAuth, ideaController.getById);
ideaRouter.post('/', requireAuth, requireCsrf, handleSingleIdeaAttachmentUpload, ideaController.create);
ideaRouter.patch('/:ideaId/share', requireAuth, requireCsrf, ideaController.share);
ideaRouter.patch('/:ideaId', requireAuth, requireCsrf, ideaController.update);
ideaRouter.delete('/:ideaId', requireAuth, requireCsrf, ideaController.delete);
ideaRouter.get('/:ideaId/comments', requireAuth, ideaController.listComments);
ideaRouter.post('/:ideaId/comments', requireAuth, requireCsrf, ideaController.createComment);
