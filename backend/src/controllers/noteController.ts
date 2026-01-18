import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { paginationParams, getParamString } from '../utils/helpers';
import { generateNotePDF, generateNotesPDF } from '../services/pdfService';
import { generateEmbedding } from '../services/ai/embeddingService';
import {
  notifyNoteCreated,
  notifyNoteUpdated,
  notifyNoteDeleted,
} from '../services/websocketService';
import fs from 'fs';

export const createNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { title, content, contentMarkdown, tags, color } = req.body;

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content,
        contentMarkdown,
        tags: tags || [],
        color,
      },
    });

    // Generate embedding asynchronously
    if (content) {
      generateEmbedding(`${title} ${content}`)
        .then(embedding => {
          return prisma.noteEmbedding.create({
            data: {
              noteId: note.id,
              embedding,
            },
          });
        })
        .catch(err => console.error('Error generating embedding:', err));
    }

    // Create initial version
    await prisma.noteVersion.create({
      data: {
        noteId: note.id,
        title: note.title,
        content: note.content,
        changedBy: userId,
      },
    });

    notifyNoteCreated(userId, note);

    res.status(201).json({
      success: true,
      data: { note },
    });
  }
);

export const getNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, skip } = paginationParams(req.query);
    const { favorite, archived } = req.query;

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (favorite === 'true') {
      where.isFavorite = true;
    }

    if (archived === 'true') {
      where.isArchived = true;
    } else {
      where.isArchived = false;
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

export const getNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
      include: {
        attachments: true,
        embeddings: true,
      },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    // Update last viewed
    await prisma.note.update({
      where: { id },
      data: { lastViewedAt: new Date() },
    });

    res.json({
      success: true,
      data: { note },
    });
  }
);

export const updateNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);
    const { title, content, contentMarkdown, tags, color, isFavorite, isArchived } = req.body;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existingNote) {
      throw createError('Note not found', 404);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (contentMarkdown !== undefined) updateData.contentMarkdown = contentMarkdown;
    if (tags !== undefined) updateData.tags = tags;
    if (color !== undefined) updateData.color = color;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    // Update embedding if content changed
    if (content && content !== existingNote.content) {
      generateEmbedding(`${title || existingNote.title} ${content}`)
        .then(embedding => {
          return prisma.noteEmbedding.upsert({
            where: { noteId: note.id },
            update: { embedding },
            create: {
              noteId: note.id,
              embedding,
            },
          });
        })
        .catch(err => console.error('Error updating embedding:', err));
    }

    // Create version if content changed
    if (
      (title && title !== existingNote.title) ||
      (content && content !== existingNote.content)
    ) {
      await prisma.noteVersion.create({
        data: {
          noteId: note.id,
          title: note.title,
          content: note.content,
          changedBy: userId,
        },
      });
    }

    notifyNoteUpdated(userId, note);

    res.json({
      success: true,
      data: { note },
    });
  }
);

export const deleteNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    await prisma.note.update({
      where: { id },
      data: { isDeleted: true },
    });

    notifyNoteDeleted(userId, id);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  }
);

export const permanentDeleteNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Note permanently deleted',
    });
  }
);

export const searchNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { q, tags, startDate, endDate } = req.query;
    const { page, limit, skip } = paginationParams(req.query);

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (q && typeof q === 'string') {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      where.tags = { hasSome: tagArray };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

export const toggleFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isFavorite: !note.isFavorite },
    });

    res.json({
      success: true,
      data: { note: updatedNote },
    });
  }
);

export const toggleArchive = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isArchived: !note.isArchived },
    });

    res.json({
      success: true,
      data: { note: updatedNote },
    });
  }
);

export const getNoteVersions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const versions = await prisma.noteVersion.findMany({
      where: { noteId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { versions },
    });
  }
);

export const restoreVersion = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);
    const versionId = getParamString(req.params.versionId);

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const version = await prisma.noteVersion.findFirst({
      where: { id: versionId, noteId: id },
    });

    if (!version) {
      throw createError('Version not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content,
      },
    });

    // Create new version for the restore
    await prisma.noteVersion.create({
      data: {
        noteId: id,
        title: version.title,
        content: version.content,
        changedBy: userId,
      },
    });

    res.json({
      success: true,
      data: { note: updatedNote },
    });
  }
);

export const exportNotePDF = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);

    const note = await prisma.note.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const filepath = await generateNotePDF(note);

    res.download(filepath, `${note.title}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading PDF:', err);
      }
      // Clean up the file after download
      fs.unlinkSync(filepath);
    });
  }
);

export const exportAllNotesPDF = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const notes = await prisma.note.findMany({
      where: { userId, isDeleted: false, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });

    if (notes.length === 0) {
      throw createError('No notes to export', 404);
    }

    const filepath = await generateNotesPDF(notes);

    res.download(filepath, 'notes-export.pdf', (err) => {
      if (err) {
        console.error('Error downloading PDF:', err);
      }
      // Clean up the file after download
      fs.unlinkSync(filepath);
    });
  }
);

export const uploadAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);
    const file = req.file;

    if (!file) {
      throw createError('No file uploaded', 400);
    }

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const attachment = await prisma.attachment.create({
      data: {
        noteId: id,
        filename: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    res.status(201).json({
      success: true,
      data: { attachment },
    });
  }
);

export const deleteAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = getParamString(req.params.id);
    const attachmentId = getParamString(req.params.attachmentId);

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, noteId: id },
    });

    if (!attachment) {
      throw createError('Attachment not found', 404);
    }

    // Delete file from disk
    if (fs.existsSync(attachment.fileUrl)) {
      fs.unlinkSync(attachment.fileUrl);
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  }
);
