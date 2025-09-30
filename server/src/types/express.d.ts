import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      upload?: Multer;
    }
  }
}
