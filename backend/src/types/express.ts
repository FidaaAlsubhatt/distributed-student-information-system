// src/types/express.d.ts
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string | number;
      email?: string;
      role?: string;
      roles?: string[];
    };
  }
}
