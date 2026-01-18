import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { NoteModel } from '../types/models.types';
import { logger } from '../utils/logger';

export const generateNotePDF = async (note: NoteModel): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `note-${note.id}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(note.title, { align: 'center' });

      doc.moveDown();

      // Metadata
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Created: ${note.createdAt.toLocaleDateString()}`, { align: 'left' });
      
      if (note.tags.length > 0) {
        doc.text(`Tags: ${note.tags.join(', ')}`, { align: 'left' });
      }

      doc.moveDown();

      // Content
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(note.content, { align: 'left' });

      // AI Summary if exists
      if (note.aiSummary) {
        doc.moveDown();
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('AI Summary:');
        doc
          .fontSize(11)
          .font('Helvetica-Oblique')
          .text(note.aiSummary);
      }

      doc.end();

      stream.on('finish', () => {
        logger.info(`PDF generated: ${filepath}`);
        resolve(filepath);
      });

      stream.on('error', (error) => {
        logger.error('Error generating PDF:', error);
        reject(error);
      });
    } catch (error) {
      logger.error('Error creating PDF document:', error);
      reject(error);
    }
  });
};

export const generateNotesPDF = async (notes: NoteModel[]): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `notes-export-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Title page
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('Notes Export', { align: 'center' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.moveDown(2);

      // Add each note
      notes.forEach((note, index) => {
        if (index > 0) {
          doc.addPage();
        }

        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(note.title);

        doc.moveDown();

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Created: ${note.createdAt.toLocaleDateString()}`);

        if (note.tags.length > 0) {
          doc.text(`Tags: ${note.tags.join(', ')}`);
        }

        doc.moveDown();

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(note.content);
      });

      doc.end();

      stream.on('finish', () => {
        logger.info(`PDF generated: ${filepath}`);
        resolve(filepath);
      });

      stream.on('error', (error) => {
        logger.error('Error generating PDF:', error);
        reject(error);
      });
    } catch (error) {
      logger.error('Error creating PDF document:', error);
      reject(error);
    }
  });
};
