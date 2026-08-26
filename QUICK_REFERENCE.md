# Quick Reference - User Management

## 🔍 Finding Users

### By ID

```bash
GET /api/v1/users/find/id/{userId}
```

### By Email

```bash
GET /api/v1/users/find/email/{email}
```

### By Google ID

```bash
GET /api/v1/users/find/google/{googleId}
```

### By Facebook ID

```bash
GET /api/v1/users/find/facebook/{facebookId}
```

### Search by Name/Email

```bash
GET /api/v1/users/search?q={searchTerm}&page=1&limit=10
```

## 👥 User Lists

### All Users (Paginated)

```bash
GET /api/v1/users/all?page=1&limit=10
```

### By Role

```bash
GET /api/v1/users/role/{role}?page=1&limit=10
# Roles: USER, VENDOR, ADMIN, SUPER_ADMIN
```

### OAuth Users

```bash
GET /api/v1/users/oauth                    # All OAuth users
GET /api/v1/users/oauth?provider=google    # Google users only
GET /api/v1/users/oauth?provider=facebook  # Facebook users only
```

### Local Users (Manual Creation)

```bash
GET /api/v1/users/local
```

### User Statistics

```bash
GET /api/v1/users/stats
```

## ➕ Creating Users

### Regular User

```bash
POST /api/v1/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Vendor/Business User

```bash
POST /api/v1/users/vendor
Authorization: Bearer <admin_token>
{
  "name": "Business Owner",
  "email": "business@example.com",
  "password": "securepassword123"
}
```

### Admin User

```bash
POST /api/v1/users/admin
Authorization: Bearer <super_admin_token>
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

## 🔗 OAuth Account Management

### Link OAuth Account

```bash
POST /api/v1/users/{userId}/link-oauth
{
  "provider": "google",
  "providerId": "123456789012345678901"
}
```

### Unlink OAuth Account

```bash
POST /api/v1/users/{userId}/unlink-oauth
{
  "provider": "google"
}
```

## 🔧 Database Queries

### Find Local Users

```javascript
const localUsers = await User.find({
     oauthProvider: { $exists: false },
     isDeleted: { $ne: true },
});
```

### Find Google Users

```javascript
const googleUsers = await User.find({
     googleId: { $exists: true, $ne: null },
     isDeleted: { $ne: true },
});
```

### Find Facebook Users

```javascript
const facebookUsers = await User.find({
     facebookId: { $exists: true, $ne: null },
     isDeleted: { $ne: true },
});
```

### Find by Multiple Criteria

```javascript
const user = await User.findOne({
     $or: [
          { email: 'john@example.com' },
          { googleId: '123456789012345678901' },
          { facebookId: '987654321098765432109' },
     ],
});
```

## 📊 User Types

| Type           | Password Required | Auto-Verified | Creation Method |
| -------------- | ----------------- | ------------- | --------------- |
| Local User     | ✅ Yes            | ❌ No         | Manual API      |
| Google OAuth   | ❌ No             | ✅ Yes        | OAuth Login     |
| Facebook OAuth | ❌ No             | ✅ Yes        | OAuth Login     |

## 🔐 Authentication Required

All user management endpoints require admin authentication:

- `Authorization: Bearer <admin_token>`
- Admin roles: `SUPER_ADMIN`, `ADMIN`

## 📝 Common Operations

### 1. Create User Manually

```javascript
const user = await UserService.createUserToDB({
     name: 'John Doe',
     email: 'john@example.com',
     password: 'securepassword123',
     role: 'USER',
});
```

### 2. Find User by Email

```javascript
const user = await UserService.findUserByEmail('john@example.com');
```

### 3. Get User Statistics

```javascript
const stats = await UserService.getUserStats();
console.log(`Total: ${stats.totalUsers}`);
console.log(`Google: ${stats.googleUsers}`);
console.log(`Facebook: ${stats.facebookUsers}`);
console.log(`Local: ${stats.localUsers}`);
```

### 4. Link OAuth Account

```javascript
const user = await UserService.linkOAuthAccount(userId, 'google', '123456789012345678901');
```

## 🚨 Important Notes

1. **OAuth users cannot use password login**
2. **Local users require email verification**
3. **All admin operations require authentication**
4. **Users are soft-deleted (isDeleted flag)**
5. **Passwords are hashed with bcrypt**
6. **OAuth users are auto-verified**

## 🔍 Finding User IDs

### From Database

```javascript
// Find by email
const user = await User.findOne({ email: 'john@example.com' });
console.log(user._id); // User ID

// Find by Google ID
const user = await User.findOne({ googleId: '123456789012345678901' });
console.log(user._id); // User ID

// Find by Facebook ID
const user = await User.findOne({ facebookId: '987654321098765432109' });
console.log(user._id); // User ID
```

### From API Response

```json
{
     "success": true,
     "data": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j1", // This is the User ID
          "name": "John Doe",
          "email": "john@example.com"
     }
}
```

### From JWT Token

```javascript
// Decode JWT token to get user ID
const decoded = jwt.verify(token, secret);
console.log(decoded.id); // User ID from token
```
