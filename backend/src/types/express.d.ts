import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      profilePicture?: string;
      aiPreferences?: any;
      createdAt: Date;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
