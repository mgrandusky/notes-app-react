import { checkOpenAI } from '../../config/openai';
import { logger } from '../../utils/logger';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const openai = checkOpenAI();
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
};

export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const openai = checkOpenAI();
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    logger.error('Error generating batch embeddings:', error);
    throw new Error('Failed to generate batch embeddings');
  }
};
