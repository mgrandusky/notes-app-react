# Notes App Backend

Production-ready backend for the AI-powered Notes Application built with Node.js, Express, TypeScript, Prisma, and OpenAI.

## 🚀 Features

### Core Features
- **Authentication**: JWT-based auth with refresh tokens, OAuth (Google, GitHub)
- **Notes Management**: Full CRUD operations with versions, tags, favorites, archive
- **Real-time Updates**: WebSocket support for live note synchronization
- **File Uploads**: Support for attachments with image, audio, PDF support
- **Note Sharing**: Secure sharing with permission levels and expiration
- **PDF Export**: Export individual notes or all notes to PDF

### AI-Powered Features (14 total)
1. **Summarization**: Generate summaries in short, medium, or long format
2. **Auto-tagging**: AI-generated tags for notes
3. **Semantic Search**: Find notes by meaning, not just keywords
4. **Writing Assistant**: Improve, expand, shorten, or rephrase content
5. **Sentiment Analysis**: Analyze emotional tone of notes
6. **Recommendations**: Get related notes based on content similarity
7. **Voice-to-Text**: Transcribe audio files using Whisper API
8. **Translation**: Translate notes to multiple languages
9. **Grammar Check**: Automated grammar and spelling correction
10. **OCR**: Extract text from images
11. **AI Chat**: Conversational AI with note context
12. **Content Generation**: Generate new content from prompts
13. **Template Generation**: Create templates for meetings, todos, journals, etc.
14. **Embeddings**: Semantic embeddings for all notes

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client
│   │   ├── env.ts       # Environment validation
│   │   ├── openai.ts    # OpenAI client
│   │   └── passport.ts  # Passport strategies
│   ├── controllers/     # Request handlers
│   │   ├── authController.ts
│   │   ├── noteController.ts
│   │   ├── shareController.ts
│   │   └── aiController.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── note.routes.ts
│   │   ├── share.routes.ts
│   │   └── ai.routes.ts
│   ├── services/        # Business logic
│   │   ├── ai/
│   │   │   ├── openaiService.ts
│   │   │   ├── embeddingService.ts
│   │   │   ├── summarizationService.ts
│   │   │   ├── transcriptionService.ts
│   │   │   ├── chatService.ts
│   │   │   └── translationService.ts
│   │   ├── emailService.ts
│   │   ├── oauthService.ts
│   │   ├── pdfService.ts
│   │   ├── uploadService.ts
│   │   └── websocketService.ts
│   ├── types/           # TypeScript types
│   │   ├── express.d.ts
│   │   └── models.types.ts
│   ├── utils/           # Utility functions
│   │   ├── validators.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── uploads/             # File upload directory
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key (for AI features)

### Setup Steps

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**
```bash
# Run migrations
npm run migrate

# Generate Prisma client
npm run prisma:generate
```

4. **Start development server**
```bash
npm run dev
```

## 📝 Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/notes_app
JWT_SECRET=your-32-char-minimum-secret
JWT_REFRESH_SECRET=your-32-char-minimum-secret
SESSION_SECRET=your-32-char-minimum-secret
FRONTEND_URL=http://localhost:3000
```

### Optional Variables
```env
# OAuth (if using social login)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password

# OpenAI (required for AI features)
OPENAI_API_KEY=your-openai-key
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get single note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Soft delete note
- `GET /api/notes/search` - Search notes
- `PATCH /api/notes/:id/favorite` - Toggle favorite
- `PATCH /api/notes/:id/archive` - Toggle archive
- `GET /api/notes/:id/versions` - Get note versions
- `POST /api/notes/:id/versions/:versionId/restore` - Restore version
- `GET /api/notes/:id/export/pdf` - Export note to PDF
- `POST /api/notes/:id/attachments` - Upload attachment

### Sharing
- `POST /api/share` - Share note
- `GET /api/share/token/:token` - Get shared note
- `GET /api/share/my-shares` - Get notes I shared
- `GET /api/share/shared-with-me` - Get notes shared with me
- `DELETE /api/share/:shareId` - Revoke share

### AI Features
- `POST /api/ai/summarize` - Summarize note
- `POST /api/ai/generate-tags` - Generate tags
- `POST /api/ai/semantic-search` - Semantic search
- `POST /api/ai/writing-assist` - Writing assistance
- `POST /api/ai/sentiment` - Sentiment analysis
- `POST /api/ai/recommendations` - Get recommendations
- `POST /api/ai/transcribe` - Transcribe audio
- `POST /api/ai/translate` - Translate note
- `POST /api/ai/grammar-check` - Check grammar
- `POST /api/ai/ocr` - Extract text from image
- `POST /api/ai/chat` - AI chat with context
- `POST /api/ai/generate-content` - Generate content
- `POST /api/ai/generate-template` - Generate template
- `POST /api/ai/embeddings/generate-all` - Generate all embeddings

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: 
  - General API: 100 req/15min
  - AI endpoints: 20 req/15min
  - Auth endpoints: 5 req/15min
- **JWT**: Secure token-based authentication
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **File Upload Limits**: 10MB max file size

## 🚦 Rate Limits

- **API Routes**: 100 requests per 15 minutes
- **AI Routes**: 20 requests per 15 minutes
- **Auth Routes**: 5 requests per 15 minutes

## 🧪 Development

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Database migrations
```bash
npm run migrate
```

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:
- **User**: User accounts with OAuth support
- **Note**: Notes with full-text content and metadata
- **NoteEmbedding**: Vector embeddings for semantic search
- **SharedNote**: Note sharing with permissions
- **NoteVersion**: Version history for notes
- **Attachment**: File attachments
- **ChatMessage**: AI chat history

## 🔧 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript 5
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Passport.js
- **AI**: OpenAI GPT-4 & Whisper
- **Real-time**: Socket.IO
- **Validation**: Zod
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Email**: Nodemailer

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and include tests.
