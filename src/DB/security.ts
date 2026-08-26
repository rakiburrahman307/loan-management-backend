import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import app, { allowedOrigins } from '../app';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import { excludeFields } from '../app/builder/QueryBuilder';
import config from '../config';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { logger } from '../shared/logger';

// ==========================================
// SECURITY MIDDLEWARE SETUP
// ==========================================
export function setupSecurity() {
     // 1. Compression Middleware
     app.use(
          compression({
               filter: (req, res) => {
                    if (req.headers['x-no-compression']) {
                         return false;
                    }
                    return compression.filter(req, res);
               },
               level: 6, // Compression level (0-9)
               threshold: 1024, // Only compress responses > 1KB
          }),
     );

     // 2. Helmet - Security Headers
     app.use(
          helmet({
               contentSecurityPolicy: {
                    directives: {
                         defaultSrc: ["'self'"],
                         scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for EJS
                         styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
                         imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
                         fontSrc: ["'self'", 'data:', 'https:'],
                         objectSrc: ["'none'"],
                         mediaSrc: ["'self'", 'blob:'],
                         frameSrc: ["'none'"],
                         connectSrc: ["'self'"],
                         upgradeInsecureRequests: config.node_env === 'production' ? [] : null,
                    },
               },
               hsts: {
                    maxAge: 31536000, // 1 year
                    includeSubDomains: true,
                    preload: true,
               },
               frameguard: { action: 'deny' },
               noSniff: true,
               xssFilter: true,
               hidePoweredBy: true,
               referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
               crossOriginEmbedderPolicy: false, // Socket.IO compatibility
               crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources
          }),
     );

     // 3. Input Sanitization - Remove Null Bytes & Dangerous Characters
     app.use((req, res, next) => {
          if (req.body) {
               const sanitizeObject = (obj: any): any => {
                    for (const key in obj) {
                         if (typeof obj[key] === 'string') {
                              // Remove null bytes
                              obj[key] = obj[key].replace(/\0/g, '');

                              // Remove potential XSS vectors
                              obj[key] = obj[key]
                                   .replace(
                                        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                                        '',
                                   )
                                   .replace(/javascript:/gi, '')
                                   .replace(/on\w+\s*=/gi, '');

                              // Limit string length to prevent DoS
                              if (obj[key].length > 10000) {
                                   obj[key] = obj[key].substring(0, 10000);
                              }
                         } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                              sanitizeObject(obj[key]);
                         }
                    }
                    return obj;
               };
               req.body = sanitizeObject(req.body);
          }
          next();
     });

     // 4. MongoDB Injection Prevention
     app.use(
          ExpressMongoSanitize({
               replaceWith: '_',
               onSanitize: ({ req, key }) => {
                    logger.warn(
                         `⚠️ Sanitized MongoDB operator injection at key: ${key} from IP: ${req.ip}`,
                    );
               },
          }),
     );

     // 5. HTTP Parameter Pollution Prevention
     app.use(
          hpp({
               whitelist: excludeFields(),
          }),
     );

     // 6. Additional Security Headers
     app.use((req, res, next) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader(
               'Permissions-Policy',
               'geolocation=(), microphone=(), camera=(), payment=()',
          );
          res.setHeader(
               'Strict-Transport-Security',
               'max-age=31536000; includeSubDomains; preload',
          );
          res.setHeader('X-Download-Options', 'noopen');
          res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
          res.removeHeader('X-Powered-By');

          // Prevent clickjacking
          res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");

          next();
     });

     // 7. Request Timeout (Prevent Slowloris Attack)
     app.use((req, res, next) => {
          const timeout = config.node_env === 'production' ? 30000 : 60000;

          const timeoutHandler = () => {
               if (!res.headersSent) {
                    logger.warn(`⏱️ Request timeout from IP: ${req.ip} - Path: ${req.path}`);
                    res.status(408).json({
                         success: false,
                         message: 'Request timeout - The request took too long to process',
                    });
               }
          };

          req.setTimeout(timeout, timeoutHandler);

          res.setTimeout(timeout, () => {
               logger.warn(`⏱️ Response timeout to IP: ${req.ip} - Path: ${req.path}`);
          });

          next();
     });

     // 8. Payload Size Limit (Already in app.ts but good to validate)
     const payloadSizeLimiter: express.RequestHandler = (req, res, next) => {
          const contentLength = parseInt(req.headers['content-length'] || '0', 10);
          const maxSize = 10 * 1024 * 1024; // 10MB

          if (contentLength > maxSize) {
               logger.warn(
                    `⚠️ Payload too large from IP: ${req.ip} - Size: ${contentLength} bytes`,
               );
               res.status(413).json({
                    success: false,
                    message: 'Payload too large',
               });
               return;
          }

          next();
     };
     app.use(payloadSizeLimiter);

     // 9. Suspicious Request Detection
     const suspiciousRequestDetector: express.RequestHandler = (req, res, next) => {
          const suspiciousPatterns = [
               /\.\.\//g, // Path traversal
               /<script/gi, // XSS attempts
               /union.*select/gi, // SQL injection
               /exec\s*\(/gi, // Command injection
               /eval\s*\(/gi, // Code execution
          ];

          const queryString = JSON.stringify(req.query);
          const bodyString = JSON.stringify(req.body);

          for (const pattern of suspiciousPatterns) {
               if (pattern.test(queryString) || pattern.test(bodyString)) {
                    logger.error(
                         `🚨 SECURITY ALERT: Suspicious request from IP: ${req.ip} - Path: ${req.path}`,
                    );
                    res.status(403).json({
                         success: false,
                         message: 'Forbidden - Suspicious request detected',
                    });
                    return;
               }
          }
          next();
     };
     app.use(suspiciousRequestDetector);

     logger.info('✅ Security middleware initialized');
}

// ==========================================
// RATE LIMITERS
// ==========================================

// Authentication Rate Limiter (Brute Force Protection)
export const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: config.node_env === 'production' ? 5 : 100,
     message: {
          success: false,
          message: 'Too many authentication attempts. Please try again after 15 minutes.',
     },
     standardHeaders: true,
     legacyHeaders: false,
     skipSuccessfulRequests: true, // Don't count successful requests
     handler: (req, res) => {
          logger.warn(`🔒 Auth rate limit exceeded from IP: ${req.ip}`);
          res.status(429).json({
               success: false,
               message: 'Too many authentication attempts. Please try again later.',
          });
     },
});

// General API Rate Limiter
export const generalLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: config.node_env === 'production' ? 100 : 1000,
     message: {
          success: false,
          message: 'Too many requests. Please try again later.',
     },
     standardHeaders: true,
     legacyHeaders: false,
     skip: (req) => {
          // Skip rate limiting for health check endpoints
          return req.path === '/health' || req.path === '/api/health';
     },
     handler: (req, res) => {
          logger.warn(`⚠️ Rate limit exceeded from IP: ${req.ip} - Path: ${req.path}`);
          res.status(429).json({
               success: false,
               message: 'Too many requests from this IP. Please try again later.',
          });
     },
});

// Strict Rate Limiter for Sensitive Operations
export const strictLimiter = rateLimit({
     windowMs: 60 * 60 * 1000, // 1 hour
     max: config.node_env === 'production' ? 3 : 50,
     message: {
          success: false,
          message: 'Too many attempts. Please try again after 1 hour.',
     },
     skipSuccessfulRequests: true,
     handler: (req, res) => {
          logger.error(`🚨 Strict rate limit exceeded from IP: ${req.ip} - Path: ${req.path}`);
          res.status(429).json({
               success: false,
               message: 'Too many attempts. Account temporarily locked.',
          });
     },
});

// ==========================================
// CORS CONFIGURATION
// ==========================================
export const corsOptions: cors.CorsOptions = {
     origin: (origin, callback) => {
          // Development: Allow all origins
          if (config.node_env === 'development') {
               return callback(null, true);
          }

          // Production: Strict origin checking
          if (!origin) {
               // Allow requests with no origin (mobile apps, Postman, server-to-server)
               return callback(null, true);
          }

          if (allowedOrigins && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
               callback(null, true);
          } else {
               logger.warn(`❌ Blocked CORS request from unauthorized origin: ${origin}`);
               callback(new Error('Not allowed by CORS'));
          }
     },
     credentials: true, // Allow cookies
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'X-CSRF-Token',
          'token',
     ],
     exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
     maxAge: 86400, // 24 hours
     preflightContinue: false,
     optionsSuccessStatus: 204,
};

// ==========================================
// SESSION CONFIGURATION
// ==========================================
export const getSessionConfig = (): session.SessionOptions => {
     const sessionConfig: session.SessionOptions = {
          secret: config.express_session as string,
          resave: false,
          saveUninitialized: false,
          name: 'sid', // Custom session ID name (security through obscurity)
          proxy: config.node_env === 'production', // Trust proxy in production
          cookie: {
               secure: config.node_env === 'production', // HTTPS only in production
               httpOnly: true, // Prevent XSS attacks
               maxAge: 24 * 60 * 60 * 1000, // 24 hours
               sameSite: config.node_env === 'production' ? 'strict' : 'lax', // CSRF protection
               // domain: config.node_env === 'production' ? '.yourdomain.com' : undefined,
          },
          rolling: true, // Refresh session on each request
          unset: 'destroy', // Destroy session data when unset
     };

     // MongoDB session store for production (Persistent sessions)
     if (config.node_env === 'production' && config.database_url) {
          sessionConfig.store = MongoStore.create({
               mongoUrl: config.database_url,
               collectionName: 'sessions',
               ttl: 24 * 60 * 60, // 1 day
               autoRemove: 'native', // Auto-remove expired sessions
               touchAfter: 24 * 3600, // Update session every 24 hours
               crypto: {
                    secret: config.express_session as string,
               },
               stringify: false, // Better performance
          });

          logger.info('✅ MongoDB session store configured');
     }

     return sessionConfig;
};
