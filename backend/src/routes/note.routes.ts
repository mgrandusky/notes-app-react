import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  permanentDeleteNote,
  searchNotes,
  toggleFavorite,
  toggleArchive,
  getNoteVersions,
  restoreVersion,
  exportNotePDF,
  exportAllNotesPDF,
  uploadAttachment,
  deleteAttachment,
} from '../controllers/noteController';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody, validate } from '../middleware/validation.middleware';
import {
  createNoteSchema,
  updateNoteSchema,
  getNoteSchema,
  searchNotesSchema,
} from '../utils/validators';
import { upload } from '../services/uploadService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// CRUD operations
router.post('/', validateBody(createNoteSchema.shape.body), createNote);
router.get('/', getNotes);
router.get('/search', validate(searchNotesSchema), searchNotes);
router.get('/export/pdf', exportAllNotesPDF);
router.get('/:id', validate(getNoteSchema), getNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', validate(getNoteSchema), deleteNote);
router.delete('/:id/permanent', validate(getNoteSchema), permanentDeleteNote);

// Quick actions
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/archive', toggleArchive);

// Versions
router.get('/:id/versions', getNoteVersions);
router.post('/:id/versions/:versionId/restore', restoreVersion);

// Export
router.get('/:id/export/pdf', exportNotePDF);

// Attachments
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
