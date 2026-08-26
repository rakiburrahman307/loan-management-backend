// Simple OAuth Configuration Test
// This file helps verify that OAuth is properly configured

import config from './config';

console.log('=== OAuth Configuration Test ===');
console.log('');

// Check Google OAuth Configuration
console.log('Google OAuth Configuration:');
console.log('Client ID:', config.social.google_client_id ? '✅ Set' : '❌ Missing');
console.log('Client Secret:', config.social.google_client_secret ? '✅ Set' : '❌ Missing');
console.log('Callback URL:', config.social.callback_url || 'Using default');
console.log('');

// Check Facebook OAuth Configuration
console.log('Facebook OAuth Configuration:');
console.log('Client ID:', config.social.facebook_client_id ? '✅ Set' : '❌ Missing');
console.log('Client Secret:', config.social.facebook_client_secret ? '✅ Set' : '❌ Missing');
console.log('');

// Check JWT Configuration
console.log('JWT Configuration:');
console.log('JWT Secret:', config.jwt.jwt_secret ? '✅ Set' : '❌ Missing');
console.log('JWT Expire:', config.jwt.jwt_expire_in || 'Not set');
console.log('JWT Refresh Secret:', config.jwt.jwt_refresh_secret ? '✅ Set' : '❌ Missing');
console.log('JWT Refresh Expire:', config.jwt.jwt_refresh_expire_in || 'Not set');
console.log('');

// Check Session Configuration
console.log('Session Configuration:');
console.log('Session Secret:', config.express_session ? '✅ Set' : '❌ Missing');
console.log('');

// Check Database Configuration
console.log('Database Configuration:');
console.log('Database URL:', config.database_url ? '✅ Set' : '❌ Missing');
console.log('');

console.log('=== Configuration Summary ===');
const hasGoogle = config.social.google_client_id && config.social.google_client_secret;
const hasFacebook = config.social.facebook_client_id && config.social.facebook_client_secret;
const hasJWT = config.jwt.jwt_secret && config.jwt.jwt_refresh_secret;
const hasSession = config.express_session;
const hasDB = config.database_url;

if (hasGoogle && hasFacebook && hasJWT && hasSession && hasDB) {
     console.log('✅ All configurations are properly set!');
     console.log('✅ OAuth should work correctly.');
} else {
     console.log('❌ Some configurations are missing:');
     if (!hasGoogle) console.log('  - Google OAuth credentials');
     if (!hasFacebook) console.log('  - Facebook OAuth credentials');
     if (!hasJWT) console.log('  - JWT secrets');
     if (!hasSession) console.log('  - Session secret');
     if (!hasDB) console.log('  - Database URL');
     console.log('');
     console.log('Please check your .env file and ensure all required variables are set.');
}

console.log('');
console.log('OAuth Test URLs:');
console.log(`Google: http://localhost:${config.port || 5000}/api/v1/auth/google`);
console.log(`Facebook: http://localhost:${config.port || 5000}/api/v1/auth/facebook`);
