import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import AppError from '../../errors/AppError';
import { Integration } from '../modules/integration/integration.model';
import { Borrower } from '../modules/borrower/borrower.model';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
     try {
          let apiKey = req.headers['x-api-key'] as string;
          const authHeader = req.headers.authorization;
          if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
               apiKey = authHeader.split(' ')[1];
          }

          if (!apiKey) {
               throw new AppError(StatusCodes.UNAUTHORIZED, 'API key is missing.');
          }

          const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

          const integration = await Integration.findOne({ apiKey: hashedKey, isActive: true });
          if (!integration) {
               throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or inactive API key.');
          }

          const borrower = await Borrower.findOne({ userId: integration.userId });
          if (!borrower) {
               throw new AppError(StatusCodes.UNAUTHORIZED, 'Borrower account associated with this API key not found.');
          }

          req.borrower = borrower;
          next();
     } catch (error) {
          next(error);
     }
};
