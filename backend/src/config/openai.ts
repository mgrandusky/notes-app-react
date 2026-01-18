import OpenAI from 'openai';
import { env } from './env';

export const openai = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

export const isOpenAIConfigured = (): boolean => {
  return openai !== null;
};

export const checkOpenAI = () => {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured');
  }
  return openai!;
};
