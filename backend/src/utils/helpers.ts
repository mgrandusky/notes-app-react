import crypto from 'crypto';

export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const getParamString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
};

export const paginationParams = (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const isExpired = (date: Date): boolean => {
  return date < new Date();
};

export const extractTextPreview = (text: string, length: number = 200): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
