import { JwtPayload } from 'jsonwebtoken';

export interface IAuthUser extends JwtPayload {
     id: string;
     role: string;
     email: string;
     sessionId?: string;
}

declare global {
     namespace Express {
          interface Request {
               user: IAuthUser;
          }
     }
}
