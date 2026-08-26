import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import session from 'express-session';
import router from './routes';
import { Morgan } from './shared/morgen';
import globalErrorHandler from './globalErrorHandler/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { welcome } from './utils/welcome';
import config from './config';
import path from 'path';
import passport from './config/passport';
import setupTimeManagement from './utils/cronJobs';
import getUploadDirectory from './utils/getUploadDirectory';
import handleStripeWebhook from './helpers/stripe/handleStripeWebhook';
import { corsOptions, generalLimiter, getSessionConfig } from './DB/security';

const app: Application = express();
if (config.node_env === 'production') {
     app.set('trust proxy', 1);
}

// ==========================================
// WEBHOOK (Before body parser)
// ==========================================
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// ==========================================
// VIEW ENGINE
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// LOGGING (Morgan)
// ==========================================
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// ==========================================
// CORS CONFIGURATION
// ==========================================
export const allowedOrigins =
     config.node_env === 'production'
          ? config.allowed_origins?.split(',').map((origin: string) => origin.trim())
          : ['*'];

app.use(cors(corsOptions));

// ==========================================
// BODY PARSERS
// ==========================================
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// SESSION (OAuth)
// ==========================================
app.use(session(getSessionConfig()));

// ==========================================
// PASSPORT INITIALIZATION
// ==========================================
app.use(passport.initialize());
app.use(passport.session());

// ==========================================
// STATIC FILES (Uploads)
// ==========================================
const baseUploadDir = getUploadDirectory();

app.use(
     express.static(baseUploadDir, {
          maxAge: config.node_env === 'production' ? '7d' : 0,
          etag: true,
          lastModified: true,
          setHeaders: (res, filePath) => {
               // Security headers
               res.setHeader('X-Content-Type-Options', 'nosniff');
               res.setHeader('X-Frame-Options', 'DENY');
               res.setHeader('Cache-Control', 'public, max-age=604800');

               // Set appropriate content types
               if (filePath.endsWith('.pdf')) {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline');
               } else if (filePath.match(/\.(jpg|jpeg)$/i)) {
                    res.setHeader('Content-Type', 'image/jpeg');
               } else if (filePath.endsWith('.png')) {
                    res.setHeader('Content-Type', 'image/png');
               } else if (filePath.endsWith('.webp')) {
                    res.setHeader('Content-Type', 'image/webp');
               } else if (filePath.endsWith('.svg')) {
                    res.setHeader('Content-Type', 'image/svg+xml');
               }
          },
     }),
);

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/health', (req: Request, res: Response) => {
     res.status(200).json({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          pid: process.pid,
          memory: process.memoryUsage(),
          environment: config.node_env,
     });
});

// ==========================================
// API ROUTES (With Rate Limiting)
// ==========================================
app.use('/api/v1', generalLimiter, router);

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get('/', (req: Request, res: Response) => {
     res.send(welcome());
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(globalErrorHandler);

// ==========================================
// 404 HANDLER (Must be last)
// ==========================================
app.use(notFound);

// ==========================================
// CRON JOBS
// ==========================================
setupTimeManagement();

export default app;
