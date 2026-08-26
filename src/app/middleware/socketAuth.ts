import { StatusCodes } from 'http-status-codes';
import { ExtendedError } from 'socket.io';
import AppError from '../../errors/AppError';
import { logger } from '../../shared/logger';
import colors from 'colors';
import { jwtHelper } from '../../helpers/jwtHelper';
import config from '../../config';
import { Secret } from 'jsonwebtoken';
import { ErrorResponse, SocketWithUser } from '../../interface/socket';

const socketAuth = (...roles: string[]) => {
     return (socket: SocketWithUser, next: (err?: ExtendedError) => void) => {
          try {
               const token =
                    socket.handshake.auth.token ||
                    socket.handshake.query.token ||
                    socket.handshake.headers.authorization;

               // Token Validation
               if (!token) {
                    return next(
                         new AppError(
                              StatusCodes.BAD_REQUEST,
                              'Authentication token is required to access this resource',
                         ),
                    );
               }

               // Extract token and verify it
               const jwtToken = extractToken(token);
               const verifiedUser = jwtHelper.verifyToken(
                    jwtToken,
                    config.jwt.jwt_secret as Secret,
               );

               // Attach user to socket
               socket.user = {
                    id: verifiedUser.id,
                    name: verifiedUser.name,
                    email: verifiedUser.email,
                    role: verifiedUser.role,
                    ...verifiedUser,
               };

               // Role-based Authorization
               if (roles.length && !roles.includes(verifiedUser.role)) {
                    logger.error(
                         colors.red(
                              `Socket authentication failed: User role ${verifiedUser.role} not authorized`,
                         ),
                    );
                    return next(
                         new AppError(
                              StatusCodes.FORBIDDEN,
                              "You don't have permission to access this socket event",
                         ),
                    );
               }

               // Successful authentication
               logger.info(colors.green(`Socket authenticated for user: ${verifiedUser.id}`));
               next();
          } catch (error) {
               handleError(socket, error, next);
          }
     };
};

// Handle errors and send responses
function handleError(socket: SocketWithUser, error: unknown, next: (err?: ExtendedError) => void) {
     if (error instanceof AppError) {
          const errorResponse: ErrorResponse = {
               statusCode: error.statusCode,
               error: getErrorName(error.statusCode),
               message: error.message,
          };
          socket.emit('socket_error', errorResponse);
     }
     next(error as ExtendedError);
}

// Map status code to error name
function getErrorName(statusCode: number): string {
     const errorNames: { [key: number]: string } = {
          [StatusCodes.BAD_REQUEST]: 'Bad Request',
          [StatusCodes.UNAUTHORIZED]: 'Unauthorized',
          [StatusCodes.FORBIDDEN]: 'Forbidden',
          [StatusCodes.NOT_FOUND]: 'Not Found',
     };
     return errorNames[statusCode] || 'Error';
}

// Extract token logic with fallback options
function extractToken(token: string | string[]): string {
     if (typeof token === 'string') {
          // Attempt to parse token from string if it looks like an object
          if (token.includes('{')) {
               try {
                    const parsedToken = JSON.parse(token);
                    return parsedToken?.token?.split(' ')[1] || parsedToken?.token || token;
               } catch {
                    logger.warn(
                         'Failed to parse token from JSON format, falling back to other methods',
                    );
               }
          }

          // Check for Bearer token
          if (token.startsWith('Bearer ')) {
               return token.split(' ')[1];
          }
     }
     return token as string; // Fallback to the original token
}

export const SocketAuthMiddleware = {
     socketAuth,
};
