# User Management Guide

This guide explains how to create, find, and manage users in your application, including OAuth users
(Google/Facebook) and local users.

## User Types

### 1. Local Users (Manual Creation)

- Users created with email/password
- Password is required
- Email verification required
- Can be created via API or admin panel

### 2. OAuth Users (Google/Facebook)

- Users created via OAuth login
- No password required
- Auto-verified
- Can link multiple OAuth providers to same email

## Creating Users

### 1. Create Local User

```bash
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "USER"
}
```

### 3. Create Admin User

```bash
POST /api/v1/users/admin
Content-Type: application/json
Authorization: Bearer <super_admin_token>

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securepassword123",
  "role": "ADMIN"
}
```

## Finding Users

### 1. Find User by ID

```bash
GET /api/v1/users/find/id/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <admin_token>
```

### 2. Find User by Email

```bash
GET /api/v1/users/find/email/john@example.com
Authorization: Bearer <admin_token>
```

### 3. Find User by Google ID

```bash
GET /api/v1/users/find/google/123456789012345678901
Authorization: Bearer <admin_token>
```

### 4. Find User by Facebook ID

```bash
GET /api/v1/users/find/facebook/987654321098765432109
Authorization: Bearer <admin_token>
```

### 5. Search Users by Name or Email

```bash
GET /api/v1/users/search?q=john&page=1&limit=10
Authorization: Bearer <admin_token>
```

### 6. Get All Users (Paginated)

```bash
GET /api/v1/users/all?page=1&limit=10
Authorization: Bearer <admin_token>
```

### 7. Get Users by Role

```bash
GET /api/v1/users/role/USER?page=1&limit=10
Authorization: Bearer <admin_token>
```

### 8. Get OAuth Users

```bash
# All OAuth users
GET /api/v1/users/oauth
Authorization: Bearer <admin_token>

# Google users only
GET /api/v1/users/oauth?provider=google
Authorization: Bearer <admin_token>

# Facebook users only
GET /api/v1/users/oauth?provider=facebook
Authorization: Bearer <admin_token>
```

### 9. Get Local Users (Non-OAuth)

```bash
GET /api/v1/users/local
Authorization: Bearer <admin_token>
```

### 10. Get User Statistics

```bash
GET /api/v1/users/stats
Authorization: Bearer <admin_token>
```

Response:

```json
{
     "success": true,
     "statusCode": 200,
     "message": "User statistics retrieved successfully",
     "data": {
          "totalUsers": 150,
          "googleUsers": 45,
          "facebookUsers": 30,
          "localUsers": 75,
          "verifiedUsers": 140,
          "blockedUsers": 5
     }
}
```

## OAuth Account Management

### 1. Link OAuth Account to Existing User

```bash
POST /api/v1/users/64f1a2b3c4d5e6f7g8h9i0j1/link-oauth
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "provider": "google",
  "providerId": "123456789012345678901"
}
```

### 2. Unlink OAuth Account

```bash
POST /api/v1/users/64f1a2b3c4d5e6f7g8h9i0j1/unlink-oauth
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "provider": "google"
}
```

## User Model Structure

```typescript
interface IUser {
     _id: string; // MongoDB ObjectId
     name: string; // User's full name
     email: string; // User's email (unique)
     password?: string; // Optional for OAuth users
     role: USER_ROLES; // USER, VENDOR, ADMIN, SUPER_ADMIN
     image?: string; // Profile image URL
     status: 'active' | 'blocked'; // Account status
     verified: boolean; // Email verification status
     isDeleted: boolean; // Soft delete flag

     // OAuth fields
     googleId?: string; // Google OAuth ID
     facebookId?: string; // Facebook OAuth ID
     oauthProvider?: 'google' | 'facebook'; // OAuth provider

     // Authentication fields
     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };

     // Other fields
     stripeCustomerId: string;
     createdAt: Date;
     updatedAt: Date;
}
```

## Database Queries Examples

### Find Local Users (Manual Creation)

```javascript
// Users created with email/password
const localUsers = await User.find({
     oauthProvider: { $exists: false },
     isDeleted: { $ne: true },
});
```

### Find Google OAuth Users

```javascript
// Users who signed up with Google
const googleUsers = await User.find({
     googleId: { $exists: true, $ne: null },
     isDeleted: { $ne: true },
});
```

### Find Facebook OAuth Users

```javascript
// Users who signed up with Facebook
const facebookUsers = await User.find({
     facebookId: { $exists: true, $ne: null },
     isDeleted: { $ne: true },
});
```

### Find Users by Email Domain

```javascript
// Users with specific email domain
const gmailUsers = await User.find({
     email: { $regex: /@gmail\.com$/ },
     isDeleted: { $ne: true },
});
```

### Find Verified Users

```javascript
// Users who have verified their email
const verifiedUsers = await User.find({
     verified: true,
     isDeleted: { $ne: true },
});
```

### Find Blocked Users

```javascript
// Users whose accounts are blocked
const blockedUsers = await User.find({
     status: 'blocked',
     isDeleted: { $ne: true },
});
```

## Common Use Cases

### 1. Manual User Creation (Admin Panel)

```javascript
// Create user manually
const newUser = await UserService.createUserToDB({
     name: 'John Doe',
     email: 'john@example.com',
     password: 'securepassword123',
     role: 'USER',
});
```

### 2. Find User by Multiple Criteria

```javascript
// Find user by email or OAuth ID
const user = await User.findOne({
     $or: [
          { email: 'john@example.com' },
          { googleId: '123456789012345678901' },
          { facebookId: '987654321098765432109' },
     ],
});
```

### 3. Link Multiple OAuth Accounts

```javascript
// User can have both Google and Facebook linked
const user = await UserService.linkOAuthAccount(userId, 'google', '123456789012345678901');
```

### 4. Get User Statistics

```javascript
const stats = await UserService.getUserStats();
console.log(`Total Users: ${stats.totalUsers}`);
console.log(`Google Users: ${stats.googleUsers}`);
console.log(`Facebook Users: ${stats.facebookUsers}`);
console.log(`Local Users: ${stats.localUsers}`);
```

## API Response Examples

### Successful User Find

```json
{
     "success": true,
     "statusCode": 200,
     "message": "User found successfully",
     "data": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "USER",
          "status": "active",
          "verified": true,
          "googleId": "123456789012345678901",
          "oauthProvider": "google",
          "createdAt": "2023-09-01T10:00:00.000Z",
          "updatedAt": "2023-09-01T10:00:00.000Z"
     }
}
```

### User Not Found

```json
{
     "success": false,
     "statusCode": 404,
     "message": "User not found",
     "data": null
}
```

## Security Notes

1. **Admin Only**: Most user management endpoints require admin privileges
2. **Password Security**: Passwords are hashed using bcrypt
3. **OAuth Security**: OAuth users are auto-verified
4. **Soft Delete**: Users are soft-deleted (isDeleted flag)
5. **Role-based Access**: Different roles have different permissions

## Best Practices

1. **Always check user existence** before operations
2. **Use pagination** for large user lists
3. **Validate input data** before database operations
4. **Handle OAuth users carefully** (they don't have passwords)
5. **Log important user operations** for audit trails
6. **Use proper error handling** for all user operations
