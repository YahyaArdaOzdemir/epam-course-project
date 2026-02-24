import { Router } from 'express';
import { ideaController } from '../controllers/idea-controller';
import { requireAuth } from '../middleware/auth-guard';
import { singleAttachmentUpload } from '../lib/upload-policy';

export const ideaRouter = Router();

ideaRouter.get('/', requireAuth, ideaController.list);
ideaRouter.post('/', requireAuth, singleAttachmentUpload.single('file'), ideaController.create);
ideaRouter.patch('/:ideaId/share', requireAuth, ideaController.share);
