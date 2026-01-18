import { checkOpenAI } from '../../config/openai';
import { logger } from '../../utils/logger';
import fs from 'fs';

export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  const openai = checkOpenAI();

  try {
    const audioFile = fs.createReadStream(audioFilePath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return response.text;
  } catch (error) {
    logger.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
};

export const transcribeAudioWithTimestamps = async (
  audioFilePath: string
): Promise<{ text: string; segments?: any[] }> => {
  const openai = checkOpenAI();

  try {
    const audioFile = fs.createReadStream(audioFilePath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    return {
      text: response.text,
      segments: (response as any).segments,
    };
  } catch (error) {
    logger.error('Error transcribing audio with timestamps:', error);
    throw new Error('Failed to transcribe audio with timestamps');
  }
};
