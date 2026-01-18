import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { generateToken, isExpired, getParamString } from '../utils/helpers';
import { sendShareNotification } from '../services/emailService';
import { notifyNoteShared } from '../services/websocketService';
import { env } from '../config/env';

export const shareNote = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { noteId, permissionLevel, expiresAt, sharedWithUserId } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const shareToken = generateToken();

    const sharedNote = await prisma.sharedNote.create({
      data: {
        noteId,
        ownerId: userId,
        sharedWithUserId,
        shareToken,
        permissionLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Send email notification if shared with specific user
    if (sharedWithUserId) {
      const sharedUser = await prisma.user.findUnique({
        where: { id: sharedWithUserId },
      });

      if (sharedUser) {
        const shareLink = `${env.FRONTEND_URL}/shared/${shareToken}`;
        sendShareNotification(sharedUser.email, note.title, shareLink).catch(err =>
          console.error('Email error:', err)
        );
        notifyNoteShared(sharedWithUserId, { note, shareLink });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        share: sharedNote,
        shareLink: `${env.FRONTEND_URL}/shared/${shareToken}`,
      },
    });
  }
);

export const getSharedNote = asyncHandler(
  async (req: Request, res: Response) => {
    const token = getParamString(req.params.token);

    const sharedNote = await prisma.sharedNote.findUnique({
      where: { shareToken: token },
      include: {
        note: true,
        owner: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!sharedNote) {
      throw createError('Shared note not found', 404);
    }

    if (sharedNote.note.isDeleted) {
      throw createError('This note has been deleted', 404);
    }

    if (sharedNote.expiresAt && isExpired(sharedNote.expiresAt)) {
      throw createError('This share link has expired', 410);
    }

    res.json({
      success: true,
      data: {
        note: sharedNote.note,
        owner: sharedNote.owner,
        permissionLevel: sharedNote.permissionLevel,
      },
    });
  }
);

export const getMySharedNotes = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const sharedNotes = await prisma.sharedNote.findMany({
      where: { ownerId: userId },
      include: {
        note: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { shares: sharedNotes },
    });
  }
);

export const getSharedWithMe = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const sharedNotes = await prisma.sharedNote.findMany({
      where: { sharedWithUserId: userId },
      include: {
        note: true,
        owner: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeShares = sharedNotes.filter(
      (share: any) =>
        !share.note.isDeleted &&
        (!share.expiresAt || !isExpired(share.expiresAt))
    );

    res.json({
      success: true,
      data: { shares: activeShares },
    });
  }
);

export const revokeShare = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shareId = getParamString(req.params.shareId);

    const sharedNote = await prisma.sharedNote.findFirst({
      where: { id: shareId, ownerId: userId },
    });

    if (!sharedNote) {
      throw createError('Shared note not found', 404);
    }

    await prisma.sharedNote.delete({
      where: { id: shareId },
    });

    res.json({
      success: true,
      message: 'Share revoked successfully',
    });
  }
);

export const updateSharePermission = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shareId = getParamString(req.params.shareId);
    const { permissionLevel } = req.body;

    const sharedNote = await prisma.sharedNote.findFirst({
      where: { id: shareId, ownerId: userId },
    });

    if (!sharedNote) {
      throw createError('Shared note not found', 404);
    }

    const updated = await prisma.sharedNote.update({
      where: { id: shareId },
      data: { permissionLevel },
    });

    res.json({
      success: true,
      data: { share: updated },
    });
  }
);
