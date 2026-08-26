import { Socket } from 'socket.io';
import { USER_ROLES } from '../enums/user';

export interface SocketWithUser extends Socket {
     user?: {
          id: string;
          name: string;
          email: string;
          role: USER_ROLES;
     };
}
// Standard error response format
export interface ErrorResponse {
     statusCode: number;
     error: string;
     message: string;
     errorMessages?: Record<string, unknown>[];
}
