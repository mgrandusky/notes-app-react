import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { generateOpenAIResponse } from '../services/ai/openaiService';
import { summarizeText } from '../services/ai/summarizationService';
import { generateEmbedding } from '../services/ai/embeddingService';
import { transcribeAudio } from '../services/ai/transcriptionService';
import { chatWithContext } from '../services/ai/chatService';
import { translateText } from '../services/ai/translationService';
import { calculateCosineSimilarity } from '../utils/helpers';
import { checkOpenAI } from '../config/openai';

// 1. Summarize note
export const summarizeNote = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId, length } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const summary = await summarizeText(note.content, length);

    await prisma.note.update({
      where: { id: noteId },
      data: { aiSummary: summary },
    });

    res.json({
      success: true,
      data: { summary },
    });
  }
);

// 2. Generate tags for note
export const generateTags = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId, maxTags } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const prompt = `Generate ${maxTags || 5} relevant tags for the following note. Return only the tags as a comma-separated list, nothing else.\n\nTitle: ${note.title}\n\nContent: ${note.content}`;

    const response = await generateOpenAIResponse(prompt, undefined, 0.5, 100);
    const tags = response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { tags },
    });

    res.json({
      success: true,
      data: { tags, note: updatedNote },
    });
  }
);

// 3. Semantic search using embeddings
export const semanticSearch = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { query, limit } = req.body;

    const queryEmbedding = await generateEmbedding(query);

    const notes = await prisma.note.findMany({
      where: {
        userId,
        isDeleted: false,
        embeddings: {
          isNot: null,
        },
      },
      include: {
        embeddings: true,
      },
    });

    const results = notes
      .map((note): { note: any; similarity: number } | null => {
        if (!note.embeddings) return null;
        const similarity = calculateCosineSimilarity(queryEmbedding, note.embeddings.embedding);
        return {
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            createdAt: note.createdAt,
          },
          similarity,
        };
      })
      .filter((result): result is { note: any; similarity: number } => result !== null && result.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit || 10);

    res.json({
      success: true,
      data: { results },
    });
  }
);

// 4. Writing assistance
export const writingAssist = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId, task } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const prompts: Record<string, string> = {
      improve: 'Improve the following text while keeping the same meaning:',
      expand: 'Expand the following text with more details and explanations:',
      shorten: 'Make the following text more concise while preserving key information:',
      rephrase: 'Rephrase the following text in a different way:',
    };

    const prompt = `${prompts[task]}\n\n${note.content}`;
    const result = await generateOpenAIResponse(prompt, undefined, 0.7, 2000);

    res.json({
      success: true,
      data: { result, task },
    });
  }
);

// 5. Sentiment analysis
export const analyzeSentiment = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const prompt = `Analyze the sentiment of the following text. Respond with ONLY a JSON object in this exact format: {"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "brief explanation"}.\n\nText: ${note.content}`;

    const response = await generateOpenAIResponse(prompt, undefined, 0.3, 200);
    
    try {
      const parsed = JSON.parse(response);
      
      await prisma.note.update({
        where: { id: noteId },
        data: {
          sentiment: parsed.sentiment,
          sentimentScore: parsed.score,
        },
      });

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      throw createError('Failed to parse sentiment analysis', 500);
    }
  }
);

// 6. Get recommendations based on note
export const getRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId, limit } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
      include: { embeddings: true },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    if (!note.embeddings) {
      throw createError('Note embeddings not generated yet', 400);
    }

    const otherNotes = await prisma.note.findMany({
      where: {
        userId,
        isDeleted: false,
        id: { not: noteId },
        embeddings: {
          isNot: null,
        },
      },
      include: {
        embeddings: true,
      },
    });

    const recommendations = otherNotes
      .map((otherNote): { note: any; similarity: number } | null => {
        if (!otherNote.embeddings) return null;
        const similarity = calculateCosineSimilarity(
          note.embeddings!.embedding,
          otherNote.embeddings.embedding
        );
        return {
          note: {
            id: otherNote.id,
            title: otherNote.title,
            tags: otherNote.tags,
            createdAt: otherNote.createdAt,
          },
          similarity,
        };
      })
      .filter((rec): rec is { note: any; similarity: number } => rec !== null && rec.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit || 5);

    res.json({
      success: true,
      data: { recommendations },
    });
  }
);

// 7. Transcribe audio to text
export const transcribeAudioNote = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw createError('No audio file provided', 400);
    }

    const text = await transcribeAudio(file.path);

    // Create note from transcription if noteId not provided
    if (!req.body.noteId) {
      const note = await prisma.note.create({
        data: {
          userId,
          title: 'Transcribed Note',
          content: text,
        },
      });

      res.json({
        success: true,
        data: { text, note },
      });
    } else {
      const note = await prisma.note.findFirst({
        where: { id: req.body.noteId, userId },
      });

      if (!note) {
        throw createError('Note not found', 404);
      }

      const updatedNote = await prisma.note.update({
        where: { id: req.body.noteId },
        data: { content: note.content + '\n\n' + text },
      });

      res.json({
        success: true,
        data: { text, note: updatedNote },
      });
    }
  }
);

// 8. Translate note
export const translateNote = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId, targetLanguage } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const translatedContent = await translateText(note.content, targetLanguage);
    const translatedTitle = await translateText(note.title, targetLanguage);

    res.json({
      success: true,
      data: {
        original: {
          title: note.title,
          content: note.content,
        },
        translated: {
          title: translatedTitle,
          content: translatedContent,
          language: targetLanguage,
        },
      },
    });
  }
);

// 9. Grammar check and correction
export const checkGrammar = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { noteId } = req.body;

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, isDeleted: false },
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const prompt = `Check the following text for grammar, spelling, and punctuation errors. Return a JSON object with this structure: {"correctedText": "the corrected text", "errors": [{"type": "error type", "original": "original text", "correction": "corrected text", "explanation": "why it was changed"}]}.\n\nText: ${note.content}`;

    const response = await generateOpenAIResponse(prompt, undefined, 0.3, 2000);
    
    try {
      const parsed = JSON.parse(response);
      res.json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      throw createError('Failed to parse grammar check results', 500);
    }
  }
);

// 10. OCR - Extract text from image
export const extractTextFromImage = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { attachmentId } = req.body;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        note: {
          userId,
        },
      },
      include: {
        note: true,
      },
    });

    if (!attachment) {
      throw createError('Attachment not found', 404);
    }

    if (!attachment.mimeType.startsWith('image/')) {
      throw createError('Attachment is not an image', 400);
    }

    const openai = checkOpenAI();
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(attachment.fileUrl);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return only the extracted text, nothing else.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${attachment.mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const extractedText = response.choices[0].message.content || '';

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { ocrText: extractedText },
    });

    res.json({
      success: true,
      data: { text: extractedText },
    });
  }
);

// 11. AI Chat with note context
export const aiChat = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { message, noteIds } = req.body;

    const response = await chatWithContext(userId, message, noteIds);

    res.json({
      success: true,
      data: { response },
    });
  }
);

// 12. Generate content based on prompt
export const generateContent = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { prompt, noteId } = req.body;

    let context = '';
    if (noteId) {
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });
      if (note) {
        context = `\n\nContext from existing note:\nTitle: ${note.title}\nContent: ${note.content}`;
      }
    }

    const fullPrompt = prompt + context;
    const content = await generateOpenAIResponse(fullPrompt, undefined, 0.8, 2000);

    res.json({
      success: true,
      data: { content },
    });
  }
);

// 13. Generate template
export const generateTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;
    const { type, customization } = req.body;

    const templates: Record<string, string> = {
      meeting: 'Generate a professional meeting notes template with sections for: date, attendees, agenda, discussion points, action items, and next steps.',
      todo: 'Generate a comprehensive to-do list template with sections for: priority tasks, in progress, completed, and notes.',
      journal: 'Generate a daily journal template with sections for: date, mood, highlights, challenges, gratitude, and tomorrow\'s goals.',
      brainstorm: 'Generate a brainstorming session template with sections for: topic, ideas, pros and cons, next actions.',
      project: 'Generate a project planning template with sections for: project name, objectives, timeline, resources, milestones, and risks.',
    };

    let prompt = templates[type] || templates.meeting;
    if (customization) {
      prompt += ` Additional customization: ${customization}`;
    }

    const template = await generateOpenAIResponse(prompt, undefined, 0.7, 1500);

    const note = await prisma.note.create({
      data: {
        userId,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Template`,
        content: template,
        tags: [type, 'template'],
      },
    });

    res.json({
      success: true,
      data: { template, note },
    });
  }
);

// 14. Generate embeddings for all notes (utility)
export const generateAllEmbeddings = asyncHandler(
  async (req: Request, res: Response) => {
    checkOpenAI();
    const userId = req.user!.id;

    const notes = await prisma.note.findMany({
      where: {
        userId,
        isDeleted: false,
        embeddings: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    let processed = 0;
    for (const note of notes) {
      try {
        const embedding = await generateEmbedding(`${note.title} ${note.content}`);
        await prisma.noteEmbedding.create({
          data: {
            noteId: note.id,
            embedding,
          },
        });
        processed++;
      } catch (error) {
        console.error(`Error generating embedding for note ${note.id}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        message: `Generated embeddings for ${processed} notes`,
        total: notes.length,
        processed,
      },
    });
  }
);

// Get chat history
export const getChatHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit = 50 } = req.query;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: { messages: messages.reverse() },
    });
  }
);

// Clear chat history
export const clearChatHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: 'Chat history cleared',
    });
  }
);
