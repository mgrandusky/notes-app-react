import { checkOpenAI } from '../../config/openai';
import { logger } from '../../utils/logger';

export const generateOpenAIResponse = async (
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> => {
  const openai = checkOpenAI();

  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    logger.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate AI response');
  }
};

export const streamOpenAIResponse = async function* (
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string> {
  const openai = checkOpenAI();

  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.error('Error streaming OpenAI response:', error);
    throw new Error('Failed to stream AI response');
  }
};
