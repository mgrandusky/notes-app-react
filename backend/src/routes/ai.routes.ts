import { Router } from 'express';
import {
  summarizeNote,
  generateTags,
  semanticSearch,
  writingAssist,
  analyzeSentiment,
  getRecommendations,
  transcribeAudioNote,
  translateNote,
  checkGrammar,
  extractTextFromImage,
  aiChat,
  generateContent,
  generateTemplate,
  generateAllEmbeddings,
  getChatHistory,
  clearChatHistory,
} from '../controllers/aiController';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  summarizeSchema,
  generateTagsSchema,
  semanticSearchSchema,
  writingAssistSchema,
  sentimentAnalysisSchema,
  recommendationsSchema,
  translateSchema,
  grammarCheckSchema,
  ocrSchema,
  chatSchema,
  generateContentSchema,
  generateTemplateSchema,
} from '../utils/validators';
import { aiLimiter } from '../middleware/rateLimiter';
import { upload } from '../services/uploadService';

const router = Router();

// All routes require authentication and AI rate limiting
router.use(requireAuth);
router.use(aiLimiter);

// AI Features
router.post('/summarize', validateBody(summarizeSchema.shape.body), summarizeNote);
router.post('/generate-tags', validateBody(generateTagsSchema.shape.body), generateTags);
router.post('/semantic-search', validateBody(semanticSearchSchema.shape.body), semanticSearch);
router.post('/writing-assist', validateBody(writingAssistSchema.shape.body), writingAssist);
router.post('/sentiment', validateBody(sentimentAnalysisSchema.shape.body), analyzeSentiment);
router.post('/recommendations', validateBody(recommendationsSchema.shape.body), getRecommendations);
router.post('/transcribe', upload.single('audio'), transcribeAudioNote);
router.post('/translate', validateBody(translateSchema.shape.body), translateNote);
router.post('/grammar-check', validateBody(grammarCheckSchema.shape.body), checkGrammar);
router.post('/ocr', validateBody(ocrSchema.shape.body), extractTextFromImage);
router.post('/chat', validateBody(chatSchema.shape.body), aiChat);
router.post('/generate-content', validateBody(generateContentSchema.shape.body), generateContent);
router.post('/generate-template', validateBody(generateTemplateSchema.shape.body), generateTemplate);

// Utility
router.post('/embeddings/generate-all', generateAllEmbeddings);

// Chat history
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', clearChatHistory);

export default router;
