# Professional Node.js API Template with OAuth Authentication

A comprehensive Node.js API template with professional OAuth authentication implementation using
Passport.js, supporting Google and Facebook login.

## Features

- **OAuth Authentication**: Google and Facebook login integration
- **JWT Token Management**: Secure token-based authentication
- **User Management**: Complete user CRUD operations
- **Email Verification**: OTP-based email verification
- **Password Reset**: Secure password reset functionality
- **File Upload**: Multer-based file upload system
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Zod schema validation
- **Database**: MongoDB with Mongoose ODM
- **Logging**: Winston-based logging system
- **Security**: Helmet, CORS, rate limiting
- **Redis Integration**: Professional Redis caching with monitoring
- **Cache Management**: Cache-first patterns with TTL and invalidation
- **Performance Optimization**: Connection pooling and exponential backoff
- **Monitoring**: Redis health checks and Prometheus metrics

## OAuth Implementation

### Supported Providers

- **Google OAuth 2.0**: Full Google login integration
- **Facebook OAuth**: Facebook login integration

### OAuth Flow

1. User clicks OAuth login button
2. Redirected to provider (Google/Facebook)
3. User authenticates with provider
4. Provider redirects back to callback URL
5. User data is processed and JWT tokens are generated
6. User is redirected to frontend with tokens

### OAuth Routes

```
GET /api/v1/auth/google          - Initiate Google OAuth
GET /api/v1/auth/google/callback - Google OAuth callback
GET /api/v1/auth/facebook        - Initiate Facebook OAuth
GET /api/v1/auth/facebook/callback - Facebook OAuth callback
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
IP_ADDRESS=localhost
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Database
DATABASE_URL=mongodb://localhost:27017/your_database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE_IN=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRE_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
EMAIL_HEADER_NAME=Your App Name

# Session
EXPRESS_SESSION_SECRET_KEY=your_session_secret

# Other Configuration
BCRYPT_SALT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:3000
RESET_TOKEN_EXPIRE_TIME=10m

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_USERNAME=default
REDIS_CONNECTION_TIMEOUT=5000
REDIS_COMMAND_TIMEOUT=3000
REDIS_RETRY_DELAY_ON_FAILURE=100
REDIS_MAX_RETRY_ATTEMPTS=3
REDIS_ENABLE_OFFLINE_QUEUE=false
REDIS_LAZY_CONNECT=true
REDIS_KEEP_ALIVE=30000
REDIS_FAMILY=4
REDIS_CACHE_TTL=600
REDIS_ENABLE_AOF=true
REDIS_ENABLE_RDB=true
REDIS_MAX_MEMORY_POLICY=allkeys-lru
```

## OAuth Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
     - `http://localhost:5000/api/v1/auth/google/callback` (development)
     - `https://yourdomain.com/api/v1/auth/google/callback` (production)
7. Copy Client ID and Client Secret to your `.env` file

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth settings:
     - Valid OAuth Redirect URIs: `http://localhost:5000/api/v1/auth/facebook/callback`
5. Copy App ID and App Secret to your `.env` file

## Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication

```
POST /api/v1/auth/login              - User login
POST /api/v1/auth/verify-email       - Verify email with OTP
POST /api/v1/auth/forget-password    - Request password reset
POST /api/v1/auth/reset-password     - Reset password
POST /api/v1/auth/change-password    - Change password
POST /api/v1/auth/refresh-token      - Refresh JWT token
POST /api/v1/auth/resend-otp         - Resend OTP
```

### OAuth Authentication

```
GET /api/v1/auth/google              - Google OAuth login
GET /api/v1/auth/google/callback     - Google OAuth callback
GET /api/v1/auth/facebook            - Facebook OAuth login
GET /api/v1/auth/facebook/callback   - Facebook OAuth callback
```

### User Management

```
GET /api/v1/users/profile            - Get user profile
PATCH /api/v1/users/profile          - Update user profile
POST /api/v1/users                   - Create new user
```

### Redis Management (Admin Only)

```
GET /api/v1/redis/health             - Redis health status
GET /api/v1/redis/metrics            - Redis performance metrics
GET /api/v1/redis/stats              - Cache statistics
GET /api/v1/redis/alerts             - Redis alerts
POST /api/v1/redis/clear-cache       - Clear cache (patterns/entities)
POST /api/v1/redis/clear-alerts      - Clear Redis alerts
GET /api/v1/redis/prometheus         - Prometheus metrics
```

## User Model Schema

```typescript
interface IUser {
     name: string;
     role: USER_ROLES;
     email: string;
     password?: string; // Optional for OAuth users
     image?: string;
     status: 'active' | 'blocked';
     verified: boolean;
     isDeleted: boolean;
     stripeCustomerId: string;

     // OAuth fields
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';

     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
}
```

## Redis Integration

This template includes a comprehensive Redis integration with professional-grade features for
caching, performance optimization, and monitoring.

### Redis Features

- **Environment-based Configuration**: All Redis settings configurable via environment variables
- **Auto-reconnection**: Exponential backoff retry strategy with configurable attempts
- **Error Handling**: Comprehensive error logging and monitoring
- **Graceful Shutdown**: Proper connection cleanup on application shutdown
- **Cache-first Pattern**: Intelligent caching with TTL management
- **Persistence**: AOF and RDB snapshot support for data durability
- **Connection Pooling**: Optimized connection management
- **Operation Timeouts**: Configurable timeouts to prevent hanging requests
- **Cache Invalidation**: Automatic cache invalidation on database changes
- **Security**: Password authentication and network access controls
- **Monitoring**: Health checks, metrics, and Prometheus integration

### Redis Configuration

Redis is configured through environment variables in your `.env` file:

```env
# Basic Redis Configuration
REDIS_HOST=localhost                    # Redis server host
REDIS_PORT=6379                        # Redis server port
REDIS_PASSWORD=your_redis_password      # Redis authentication password
REDIS_DB=0                             # Redis database number
REDIS_USERNAME=default                 # Redis username (Redis 6+)

# Connection Settings
REDIS_CONNECTION_TIMEOUT=5000          # Connection timeout (ms)
REDIS_COMMAND_TIMEOUT=3000             # Command timeout (ms)
REDIS_RETRY_DELAY_ON_FAILURE=100       # Retry delay (ms)
REDIS_MAX_RETRY_ATTEMPTS=3             # Max retry attempts
REDIS_ENABLE_OFFLINE_QUEUE=false       # Enable offline queue
REDIS_LAZY_CONNECT=true                # Lazy connection
REDIS_KEEP_ALIVE=30000                 # Keep alive interval (ms)
REDIS_FAMILY=4                         # IP family (4 or 6)

# Cache Settings
REDIS_CACHE_TTL=600                    # Default cache TTL (seconds)

# Persistence Settings
REDIS_ENABLE_AOF=true                  # Enable AOF persistence
REDIS_ENABLE_RDB=true                  # Enable RDB snapshots
REDIS_MAX_MEMORY_POLICY=allkeys-lru    # Memory eviction policy
```

### Usage Examples

#### Basic Cache Operations

```typescript
import redisCacheService from '../shared/redisCache';

// Set cache with TTL
await redisCacheService.set('user:123', userData, { ttl: 300 });

// Get from cache
const cachedUser = await redisCacheService.get('user:123');

// Delete from cache
await redisCacheService.delete('user:123');

// Cache-first pattern
const user = await redisCacheService.getOrSet('user:123', () => User.findById(123), { ttl: 300 });
```

#### Using Redis Helpers

```typescript
import {
     cacheFirstQuery,
     cacheUserData,
     invalidateEntityCache,
     checkRateLimit,
} from '../helpers/redisHelper';

// Cache database queries
const users = await cacheFirstQuery(
     'users:all',
     () => User.find(),
     600, // 10 minutes TTL
);

// Cache user-specific data
const userProfile = await cacheUserData(
     userId,
     'profile',
     () => getUserProfile(userId),
     300, // 5 minutes TTL
);

// Rate limiting
const rateLimit = await checkRateLimit(
     'api',
     userId,
     100, // 100 requests
     3600, // per hour
);

if (!rateLimit.allowed) {
     throw new Error('Rate limit exceeded');
}

// Invalidate cache after updates
await invalidateEntityCache('user', userId);
```

#### Middleware Usage

```typescript
import { cacheGetRequest, invalidateAfterMutation } from '../helpers/redisHelper';

// Cache GET requests
router.get('/users', cacheGetRequest({ ttl: 300 }), UserController.getUsers);

// Auto-invalidate cache after mutations
router.post(
     '/users',
     invalidateAfterMutation('user', 'create', {
          invalidatePatterns: ['users:*'],
          invalidateRelated: ['stats'],
     }),
     UserController.createUser,
);

router.put('/users/:id', invalidateAfterMutation('user', 'update'), UserController.updateUser);
```

### Redis Monitoring

The template includes comprehensive Redis monitoring:

#### Health Check

```bash
GET /api/v1/redis/health
```

Response:

```json
{
     "success": true,
     "data": {
          "redis": {
               "connected": true,
               "healthCheck": true,
               "status": "healthy"
          },
          "metrics": {
               "uptime": 86400,
               "connectedClients": 5,
               "usedMemory": 1048576,
               "hitRatio": 85.5
          }
     }
}
```

#### Performance Metrics

```bash
GET /api/v1/redis/metrics
```

#### Cache Statistics

```bash
GET /api/v1/redis/stats
```

#### Prometheus Integration

```bash
GET /api/v1/redis/prometheus
```

### Best Practices

1. **Use appropriate TTL values**:

     - User sessions: 1-24 hours
     - API responses: 5-15 minutes
     - Database queries: 10-60 minutes
     - Static content: 1-24 hours

2. **Implement cache invalidation**:

     - Use middleware for automatic invalidation
     - Invalidate related caches when data changes
     - Use patterns for bulk invalidation

3. **Monitor Redis performance**:

     - Check hit ratios regularly
     - Monitor memory usage
     - Watch for slow queries
     - Set up alerts for critical metrics

4. **Security considerations**:

     - Use strong Redis passwords
     - Restrict network access
     - Enable SSL/TLS in production
     - Regularly update Redis version

5. **Error handling**:
     - Always handle Redis failures gracefully
     - Implement fallback mechanisms
     - Log Redis errors for monitoring
     - Use circuit breakers for resilience

### Redis Setup

#### Local Development

```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                 # macOS

# Start Redis
redis-server

# Test connection
redis-cli ping
```

#### Production Setup

```bash
# Configure Redis persistence
echo "appendonly yes" >> /etc/redis/redis.conf
echo "appendfsync everysec" >> /etc/redis/redis.conf

# Set memory policy
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf

# Enable authentication
echo "requirepass your_strong_password" >> /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis
```

### Troubleshooting

#### Common Issues

1. **Connection refused**:

     - Check if Redis server is running
     - Verify host and port configuration
     - Check firewall settings

2. **Authentication failed**:

     - Verify Redis password
     - Check username (Redis 6+)
     - Ensure proper ACL configuration

3. **High memory usage**:

     - Check TTL settings
     - Monitor key expiration
     - Adjust memory policy
     - Consider data compression

4. **Low hit ratio**:
     - Review caching strategy
     - Adjust TTL values
     - Check cache invalidation logic
     - Monitor access patterns

#### Debug Commands

```bash
# Check Redis info
redis-cli info

# Monitor Redis commands
redis-cli monitor

# Check slow queries
redis-cli slowlog get 10

# Memory usage analysis
redis-cli --bigkeys
```

## User Model Schema

```typescript
interface IUser {
     name: string;
     role: USER_ROLES;
     email: string;
     password?: string; // Optional for OAuth users
     image?: string;
     status: 'active' | 'blocked';
     verified: boolean;
     isDeleted: boolean;
     stripeCustomerId: string;

     // OAuth fields
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';

     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
}
```

## OAuth User Flow

### New OAuth User

1. User clicks "Login with Google/Facebook"
2. OAuth provider authenticates user
3. System checks if user exists by OAuth ID
4. If not found, checks by email
5. If email exists, links OAuth account to existing user
6. If no user found, creates new user with OAuth data
7. User is auto-verified and logged in
8. JWT tokens are generated and returned

### Existing OAuth User

1. User clicks "Login with Google/Facebook"
2. OAuth provider authenticates user
3. System finds user by OAuth ID
4. User is logged in with JWT tokens

### Mixed Authentication

- Users can link multiple OAuth providers to same email
- System prevents duplicate accounts
- OAuth users are auto-verified
- OAuth users cannot use password login

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Express-session for OAuth flows
- **CORS**: Configurable CORS settings
- **Rate Limiting**: Built-in rate limiting
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error handling
- **Logging**: Winston-based logging system

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Zod schema validation errors
- **Authentication Errors**: JWT and OAuth errors
- **Database Errors**: MongoDB connection and query errors
- **Business Logic Errors**: Custom application errors
- **Global Error Handler**: Centralized error processing

## Logging

The application uses Winston for logging:

- **Success Logs**: API requests and responses
- **Error Logs**: Application errors and exceptions
- **Daily Rotation**: Log files rotate daily
- **Multiple Levels**: Different log levels for different purposes

## Development

```bash
# Run with hot reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Seed admin user
npm run seed
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure OAuth callback URLs
5. Set up proper CORS origins
6. Configure email settings
7. Set up logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Additional Resources

Happy Coding! 🚀 Thank you for using the **Backend Template**! 🚴‍♂️

## Step 1 - Set Up Your Project Environment

Here's how you can set up your Node.js project with the required dependencies:

**1. Initialize the Project:**

Create a `package.json` file for managing your project dependencies.

```bash
npm init -y
```

**2. Install Required Packages:**

Add essential libraries and tools for your application:

```bash
npm install express       # Web framework for building APIs
npm install cors          # Enables Cross-Origin Resource Sharing
npm install dotenv        # Manages environment variables
npm install mongoose      # MongoDB object modeling tool
```

**3. Add TypeScript Support:**

Install TypeScript type definitions for the above libraries:

```bash
npm install @types/express @types/node @types/cors --save-dev
```

**4. Install Development Tools:**

Add `nodemon` for automatic server restarts during development:

```bash
npm install -D nodemon
```

## Step 2 — Adding TypeScript

We need to add a typescript package in our project, so that we can use the TypeScript compiler and
other related tools.

```bash
npm i -D typescript
```

This command will add typescript package as a dev-dependency in our project.

Now, we need to add typescript config file, for that we will use the below given command.

```bash
tsc --init
```

This will create a **tsconfig.json file**, with the default compiler configurations shown in the
image below.

In the **tsconfig.json file**, remove the comments on the **rootDir** option and modify it, to set
**src** as root directory for typescript.

`"rootDir": "./src"`,

Similarly, do this for **outDir** option as well

`"outDir": "./dist"`,

All .js files will be created in this **build** folder after compiling the .ts files which are
inside the src folder.

## Step 3 — Adding Eslint

For adding eslint, we will install the required packages given below.

```bash
npm i -D eslint@9.14.0 @eslint/js @types/eslint__js typescript typescript-eslint
```

Now make a eslint.config.mjs file in the root of the project director.

```bash
npx eslint --init
```

At this point you may see that your version of `eslint: "^9.14.0"` has been changed to eslint:
`"^9.15.0"`

if that happens remove the eslint : `npm remove eslint` Then re-install: `npm i -D eslint@9.14.0`

Now add the following code inside it.

```js
{
    ignores: ["node_modules", "dist"],
    rules: {
      "no-unused-vars": "error",
    },
  },
```

```js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
     { files: ['**/*.{js,mjs,cjs,ts}'] },
     { languageOptions: { globals: globals.node } },
     pluginJs.configs.recommended,
     ...tseslint.configs.recommended,
     {
          ignores: ['node_modules', 'dist'],
          rules: {
               'no-unused-vars': 'off',
               '@typescript-eslint/no-unused-vars': 'error',
               'no-unused-expressions': 'error',
               'prefer-const': 'error',
               'no-undef': 'error',
               'no-console': 'warn',
          },
     },
];
```

Now in the terminal, you can run npm eslint . You can see that eslint is working.

We can also add scripts for eslint in the **package.json** file.

```js
"scripts": {
"lint": "eslint src/**/*.ts",
"lint:fix": "eslint src/**/*.ts --fix"
},
```

## Step 4 — Adding Prettier

Add the prettier package in your project.

```bash
npm i -D --exact prettier
```

Now create `.prettierrc` and `.prettierignore` file in the root of your project.

Include basic configurations for prettier in the `.prettierrc` file.

```js
{
  "semi": true,
  "singleQuote": true
}
```

Also, we need to tell prettier which files to not format So inside `.prettierignore` include the
following.

```js
dist;
```

Finally we can add scripts for prettier as well in the **package.json** file.

`"format": "prettier . --write"`

## Step 5 — Adding Ts-Node-Dev

`ts-node-dev` Installation and Usage

**Why install and use** `ts-node-dev`?

**Installation:**

- `ts-node-dev` is a development dependency for TypeScript projects.

**Install it using:**

```bash
npm i ts-node-dev --save-dev
```

**Usage:**

- It runs TypeScript files directly, so you don't need to manually compile them using tsc.

- It automatically restarts the server when file changes are detected, making development faster.

- Command to start your server:

```bash
npx ts-node-dev --transpile-only src/server.ts
```

## Project Scripts

```
"scripts": {
  "build": "tsc",                                                   # Compiles TypeScript files to JavaScript
  "start:dev": "npx ts-node-dev --transpile-only src/server.ts",    # Runs the server in development mode with hot-reloading
  "start:prod": "node ./dist/server.js",                            # Starts the server in production mode
  "start": "nodemon ./dist/server.js",                              # Runs the production build with automatic restarts
  "lint": "eslint src/**/*.ts",                                     # Checks code style and errors using ESLint
  "lint:fix": "eslint src/**/*.ts --fix",                           # Fixes code style issues automatically
  "format": "prettier . --write"                                    # Formats code consistently with Prettier
}
```
