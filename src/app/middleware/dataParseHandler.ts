import { Request, Response, NextFunction } from 'express';

const parseJsonMiddleware = (req: Request, res: Response, next: NextFunction) => {
     try {
          if (req.body && req.body.data) {
               req.body = JSON.parse(req.body.data);
          }
          next();
     } catch (error) {
          next(error);
     }
};

export default parseJsonMiddleware;
