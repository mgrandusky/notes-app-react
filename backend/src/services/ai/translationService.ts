import { generateOpenAIResponse } from './openaiService';

export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string> => {
  const sourceLang = sourceLanguage ? `from ${sourceLanguage}` : 'automatically detecting the source language';
  const prompt = `Translate the following text ${sourceLang} to ${targetLanguage}. Preserve the formatting and structure:\n\n${text}`;

  const systemPrompt = 'You are a professional translator. Provide accurate translations while preserving the original meaning and tone.';

  return await generateOpenAIResponse(prompt, systemPrompt, 0.3, 2000);
};

export const detectLanguage = async (text: string): Promise<string> => {
  const prompt = `Detect the language of the following text and respond with only the ISO 639-1 two-letter language code (e.g., "en" for English, "es" for Spanish):\n\n${text}`;

  const response = await generateOpenAIResponse(prompt, undefined, 0.3, 10);
  return response.trim().toLowerCase().substring(0, 2);
};

export const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
  };

  return languages[code] || code;
};
