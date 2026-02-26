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
ideaRouter.put('/:ideaId/vote', requireAuth, requireCsrf, ideaController.voteIdea);
ideaRouter.get('/:ideaId/comments', requireAuth, ideaController.listComments);
ideaRouter.post('/:ideaId/comments', requireAuth, requireCsrf, ideaController.createComment);
ideaRouter.delete('/:ideaId/comments/:commentId', requireAuth, requireCsrf, ideaController.deleteComment);
ideaRouter.put('/:ideaId/comments/:commentId/vote', requireAuth, requireCsrf, ideaController.voteComment);
