export interface UserModel {
  id: string;
  username: string;
  email: string;
  password?: string;
  oauthProvider?: string;
  oauthId?: string;
  profilePicture?: string;
  aiPreferences?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteModel {
  id: string;
  userId: string;
  title: string;
  content: string;
  contentMarkdown?: string | null;
  tags: string[];
  color?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  aiSummary?: string | null;
  sentiment?: string | null;
  sentimentScore?: number | null;
  language?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date | null;
}

export interface SharedNoteModel {
  id: string;
  noteId: string;
  ownerId: string;
  sharedWithUserId?: string;
  shareToken?: string;
  permissionLevel: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface NoteVersionModel {
  id: string;
  noteId: string;
  title: string;
  content: string;
  changedBy?: string;
  createdAt: Date;
}

export interface AttachmentModel {
  id: string;
  noteId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  ocrText?: string;
  createdAt: Date;
}

export interface ChatMessageModel {
  id: string;
  userId: string;
  role: string;
  message: string;
  context?: any;
  createdAt: Date;
}

export interface NoteEmbeddingModel {
  id: string;
  noteId: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type PermissionLevel = 'view' | 'edit';
export type AITask = 'improve' | 'expand' | 'shorten' | 'rephrase';
export type SummaryLength = 'short' | 'medium' | 'long';
export type TemplateType = 'meeting' | 'todo' | 'journal' | 'brainstorm' | 'project';
