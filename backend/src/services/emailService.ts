import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: parseInt(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  if (!transporter) {
    logger.warn('Email service not configured, skipping email send');
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWelcomeEmail = async (email: string, username: string): Promise<void> => {
  const subject = 'Welcome to Notes App!';
  const html = `
    <h1>Welcome ${username}!</h1>
    <p>Thank you for joining Notes App. We're excited to have you on board.</p>
    <p>Start creating your first note and explore our AI-powered features!</p>
  `;

  await sendEmail(email, subject, html);
};

export const sendShareNotification = async (
  email: string,
  noteTitle: string,
  shareLink: string
): Promise<void> => {
  const subject = 'A note has been shared with you';
  const html = `
    <h1>New Shared Note</h1>
    <p>Someone has shared the note "<strong>${noteTitle}</strong>" with you.</p>
    <p><a href="${shareLink}">Click here to view the note</a></p>
  `;

  await sendEmail(email, subject, html);
};
