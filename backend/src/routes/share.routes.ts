import { Router } from 'express';
import {
  shareNote,
  getSharedNote,
  getMySharedNotes,
  getSharedWithMe,
  revokeShare,
  updateSharePermission,
} from '../controllers/shareController';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody, validate } from '../middleware/validation.middleware';
import { shareNoteSchema, revokeShareSchema } from '../utils/validators';

const router = Router();

// Public route - no auth required
router.get('/token/:token', getSharedNote);

// Protected routes
router.use(requireAuth);

router.post('/', validateBody(shareNoteSchema.shape.body), shareNote);
router.get('/my-shares', getMySharedNotes);
router.get('/shared-with-me', getSharedWithMe);
router.delete('/:shareId', validate(revokeShareSchema), revokeShare);
router.patch('/:shareId/permission', updateSharePermission);

export default router;
