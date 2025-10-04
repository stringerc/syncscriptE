# Identity & Access Context Contract

## Public API

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "emailVerified": false
    },
    "token": "string"
  }
}
```

**Error Codes**:
- `400`: Invalid email format or password requirements not met
- `409`: Email already exists
- `500`: Internal server error

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "emailVerified": true
    },
    "token": "string"
  }
}
```

**Error Codes**:
- `401`: Invalid credentials
- `403`: Account not verified
- `429`: Too many login attempts

#### POST /api/auth/refresh
Refresh JWT token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "string"
  }
}
```

### User Management Endpoints

#### GET /api/user/profile
Get current user profile.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "timezone": "string",
    "avatar": "string",
    "currentLocation": "string",
    "homeLocation": "string",
    "workLocation": "string",
    "showHolidays": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/user/profile
Update user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "string",
  "timezone": "string",
  "avatar": "string",
  "currentLocation": "string",
  "homeLocation": "string",
  "workLocation": "string",
  "showHolidays": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "timezone": "string",
    "avatar": "string",
    "currentLocation": "string",
    "homeLocation": "string",
    "workLocation": "string",
    "showHolidays": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Feature Flags Endpoints

#### GET /api/feature-flags/flags
Get user's feature flags.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "askAI": false,
    "focusLock": false,
    "mic": false,
    "priorityHierarchy": false,
    "templates": false,
    "pinnedEvents": false,
    "googleCalendar": false,
    "outlookCalendar": false,
    "appleCalendar": false,
    "friends": false,
    "shareScript": false,
    "energyHUD": false,
    "energyGraph": false
  }
}
```

#### PATCH /api/feature-flags/flags
Update user's feature flags.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "askAI": true,
  "focusLock": false,
  "mic": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "askAI": true,
    "focusLock": false,
    "mic": true,
    "priorityHierarchy": false,
    "templates": false,
    "pinnedEvents": false,
    "googleCalendar": false,
    "outlookCalendar": false,
    "appleCalendar": false,
    "friends": false,
    "shareScript": false,
    "energyHUD": false,
    "energyGraph": false
  }
}
```

## Events Emitted

### user.created
Emitted when a new user account is created.

**Event Data**:
```json
{
  "userId": "string",
  "email": "string",
  "name": "string",
  "timezone": "string",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### user.updated
Emitted when user profile is updated.

**Event Data**:
```json
{
  "userId": "string",
  "changes": {
    "name": "string",
    "timezone": "string",
    "avatar": "string"
  },
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### user.deleted
Emitted when user account is deleted.

**Event Data**:
```json
{
  "userId": "string",
  "deletedAt": "2024-01-01T00:00:00Z"
}
```

### feature_flag.changed
Emitted when user's feature flags are updated.

**Event Data**:
```json
{
  "userId": "string",
  "flags": {
    "askAI": true,
    "focusLock": false
  },
  "changedAt": "2024-01-01T00:00:00Z"
}
```

## Events Consumed

None - this context is the source of truth for user identity.

## Invariants

1. **User Identity Immutability**: Once a user ID is created, it cannot be changed
2. **Email Uniqueness**: Each email address can only be associated with one user account
3. **Feature Flag Scoping**: Feature flags are user-scoped and cannot affect other users
4. **Audit Trail**: All user actions are logged in the audit log
5. **Token Expiry**: JWT tokens expire after 24 hours, refresh tokens after 30 days
6. **Password Security**: Passwords are hashed using bcrypt with salt rounds >= 12
7. **Email Verification**: Users must verify their email before accessing protected features

## Error Codes

### Authentication Errors
- `AUTH_INVALID_CREDENTIALS`: Email or password is incorrect
- `AUTH_ACCOUNT_NOT_VERIFIED`: Email verification required
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_RATE_LIMITED`: Too many authentication attempts

### User Management Errors
- `USER_NOT_FOUND`: User with specified ID does not exist
- `USER_EMAIL_EXISTS`: Email address is already in use
- `USER_INVALID_TIMEZONE`: Timezone is not valid
- `USER_INVALID_LOCATION`: Location format is invalid

### Feature Flag Errors
- `FLAG_INVALID_NAME`: Feature flag name is not recognized
- `FLAG_INVALID_VALUE`: Feature flag value is not boolean
- `FLAG_UPDATE_FAILED`: Failed to update feature flags

## Rate Limiting

- **Authentication**: 5 attempts per minute per IP
- **Profile Updates**: 10 requests per minute per user
- **Feature Flag Updates**: 5 requests per minute per user

## Security Considerations

1. **JWT Security**: Tokens are signed with RS256 and include user ID, email, and expiry
2. **Password Requirements**: Minimum 8 characters, must include uppercase, lowercase, number, and special character
3. **Email Verification**: Required for account activation and password resets
4. **Rate Limiting**: Applied to all authentication endpoints
5. **Audit Logging**: All admin actions and sensitive operations are logged
6. **Data Privacy**: User data is encrypted at rest and in transit
