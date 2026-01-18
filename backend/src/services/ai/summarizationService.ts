import { generateOpenAIResponse } from './openaiService';
import { SummaryLength } from '../../types/models.types';

const getLengthPrompt = (length: SummaryLength): string => {
  switch (length) {
    case 'short':
      return 'in 1-2 sentences';
    case 'medium':
      return 'in 3-5 sentences';
    case 'long':
      return 'in 2-3 paragraphs';
    default:
      return 'in 3-5 sentences';
  }
};

export const summarizeText = async (
  text: string,
  length: SummaryLength = 'medium'
): Promise<string> => {
  const lengthPrompt = getLengthPrompt(length);
  const prompt = `Please summarize the following text ${lengthPrompt}:\n\n${text}`;
  
  const systemPrompt = 'You are a helpful assistant that creates clear and concise summaries of text content.';

  return await generateOpenAIResponse(prompt, systemPrompt, 0.5, 500);
};

export const generateKeyPoints = async (text: string): Promise<string[]> => {
  const prompt = `Extract the main key points from the following text as a bullet list:\n\n${text}`;
  
  const systemPrompt = 'You are a helpful assistant that extracts key points from text. Return only the bullet points, one per line, starting with a dash.';

  const response = await generateOpenAIResponse(prompt, systemPrompt, 0.5, 500);
  
  return response
    .split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(line => line.length > 0);
};
