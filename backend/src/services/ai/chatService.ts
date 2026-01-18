import { generateOpenAIResponse } from './openaiService';
import { prisma } from '../../config/database';

export const chatWithContext = async (
  userId: string,
  message: string,
  noteIds?: string[]
): Promise<string> => {
  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get note context if provided
  let contextText = '';
  if (noteIds && noteIds.length > 0) {
    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
        userId,
      },
      select: { title: true, content: true },
    });

    contextText = notes
      .map((note: any) => `Note: ${note.title}\n${note.content}`)
      .join('\n\n');
  }

  // Build conversation context
  const conversationHistory = history
    .reverse()
    .map((msg: any) => `${msg.role}: ${msg.message}`)
    .join('\n');

  let prompt = message;
  if (contextText) {
    prompt = `Context from notes:\n${contextText}\n\nUser question: ${message}`;
  }
  if (conversationHistory) {
    prompt = `Previous conversation:\n${conversationHistory}\n\n${prompt}`;
  }

  const systemPrompt = 'You are a helpful AI assistant for a note-taking application. Help users with their notes, answer questions, and provide insights based on their content.';

  const response = await generateOpenAIResponse(prompt, systemPrompt, 0.8, 1000);

  // Save conversation
  await prisma.chatMessage.createMany({
    data: [
      {
        userId,
        role: 'user',
        message,
        context: noteIds ? { noteIds } : undefined,
      },
      {
        userId,
        role: 'assistant',
        message: response,
      },
    ],
  });

  return response;
};
