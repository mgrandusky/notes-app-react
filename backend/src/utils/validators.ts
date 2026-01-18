import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

// Note validation schemas
export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string(),
    contentMarkdown: z.string().optional(),
    tags: z.array(z.string()).default([]),
    color: z.string().optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional(),
    contentMarkdown: z.string().optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getNoteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const searchNotesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    tags: z.string().optional(),
    favorite: z.string().optional(),
    archived: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

// Share validation schemas
export const shareNoteSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    permissionLevel: z.enum(['view', 'edit']),
    expiresAt: z.string().datetime().optional(),
    sharedWithUserId: z.string().uuid().optional(),
  }),
});

export const revokeShareSchema = z.object({
  params: z.object({
    shareId: z.string().uuid(),
  }),
});

// AI validation schemas
export const summarizeSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  }),
});

export const generateTagsSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    maxTags: z.number().int().min(1).max(10).optional().default(5),
  }),
});

export const semanticSearchSchema = z.object({
  body: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(50).optional().default(10),
  }),
});

export const writingAssistSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    task: z.enum(['improve', 'expand', 'shorten', 'rephrase']),
  }),
});

export const sentimentAnalysisSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
  }),
});

export const recommendationsSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    limit: z.number().int().min(1).max(10).optional().default(5),
  }),
});

export const transcribeSchema = z.object({
  body: z.object({
    noteId: z.string().uuid().optional(),
  }),
});

export const translateSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
    targetLanguage: z.string().length(2),
  }),
});

export const grammarCheckSchema = z.object({
  body: z.object({
    noteId: z.string().uuid(),
  }),
});

export const ocrSchema = z.object({
  body: z.object({
    attachmentId: z.string().uuid(),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    noteIds: z.array(z.string().uuid()).optional(),
  }),
});

export const generateContentSchema = z.object({
  body: z.object({
    prompt: z.string().min(1),
    noteId: z.string().uuid().optional(),
  }),
});

export const generateTemplateSchema = z.object({
  body: z.object({
    type: z.enum(['meeting', 'todo', 'journal', 'brainstorm', 'project']),
    customization: z.string().optional(),
  }),
});
