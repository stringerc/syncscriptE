# SyncScript API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Responses
All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack (development only)"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "energyLevel": 7,
      "timezone": "UTC-8",
      "settings": { ... }
    },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "energyLevel": 7,
    "timezone": "UTC-8",
    "settings": { ... },
    "achievements": [ ... ],
    "streaks": [ ... ],
    "_count": {
      "tasks": 15,
      "events": 8,
      "notifications": 3
    }
  }
}
```

#### PUT /auth/change-password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Tasks

#### GET /tasks
Get all tasks with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, DEFERRED)
- `priority` (string): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `tags` (string): Comma-separated tags to filter by
- `search` (string): Search in title and description
- `sortBy` (string): Sort field (createdAt, dueDate, priority, title)
- `sortOrder` (string): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-id",
      "title": "Complete project proposal",
      "description": "Write and submit the Q1 project proposal",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "estimatedDuration": 120,
      "energyRequired": 7,
      "budgetImpact": 0,
      "aiGenerated": false,
      "scheduledAt": null,
      "completedAt": null,
      "tags": ["work", "important"],
      "subtasks": [
        {
          "id": "subtask-id",
          "title": "Research requirements",
          "completed": false,
          "order": 0
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal",
  "priority": "HIGH",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "estimatedDuration": 120,
  "energyRequired": 7,
  "budgetImpact": 0,
  "tags": ["work", "important"],
  "subtasks": [
    {
      "title": "Research requirements",
      "order": 0
    }
  ]
}
```

#### PUT /tasks/:id
Update an existing task.

**Request Body:** (same as POST, all fields optional)

#### DELETE /tasks/:id
Delete a task.

#### PATCH /tasks/:id/complete
Mark a task as completed.

**Request Body:**
```json
{
  "actualDuration": 90
}
```

#### GET /tasks/today
Get today's tasks.

#### GET /tasks/overdue
Get overdue tasks.

#### PATCH /tasks/bulk-priority
Update priority for multiple tasks.

**Request Body:**
```json
{
  "taskIds": ["task-id-1", "task-id-2"],
  "priority": "HIGH"
}
```

### Calendar

#### GET /calendar
Get all events with filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range filter
- `search`: Search in title, description, location
- `sortBy`: Sort field (startTime, title, createdAt)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-id",
      "title": "Team Meeting",
      "description": "Weekly team sync",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T11:00:00.000Z",
      "location": "Conference Room A",
      "isAllDay": false,
      "calendarEventId": "google-event-id",
      "calendarProvider": "google",
      "aiGenerated": false,
      "budgetImpact": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /calendar
Create a new event.

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "location": "Conference Room A",
  "isAllDay": false,
  "budgetImpact": 0
}
```

#### PUT /calendar/:id
Update an existing event.

#### DELETE /calendar/:id
Delete an event.

#### GET /calendar/today
Get today's events.

#### GET /calendar/upcoming
Get upcoming events.

**Query Parameters:**
- `days` (number): Number of days ahead (default: 7)

#### POST /calendar/check-conflicts
Check for schedule conflicts.

**Request Body:**
```json
{
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "excludeEventId": "event-id-to-exclude"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasConflicts": true,
    "conflicts": [
      {
        "id": "conflicting-event-id",
        "title": "Conflicting Event",
        "startTime": "2024-01-15T10:30:00.000Z",
        "endTime": "2024-01-15T11:30:00.000Z",
        "location": "Same Room"
      }
    ]
  }
}
```

### AI Features

#### POST /ai/extract-conversation
Extract tasks and events from conversation text.

**Request Body:**
```json
{
  "content": "Let's grab lunch Wednesday at 12pm. Also need to finish the quarterly report by Friday.",
  "source": "chatgpt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conversation-id",
      "userId": "user-id",
      "content": "Let's grab lunch...",
      "source": "chatgpt",
      "extractedTasks": ["task-id-1"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "extractedTasks": [
      {
        "id": "task-id-1",
        "title": "Finish quarterly report",
        "description": null,
        "priority": "MEDIUM",
        "dueDate": "2024-01-05T00:00:00.000Z",
        "estimatedDuration": null,
        "energyRequired": null,
        "budgetImpact": null,
        "aiGenerated": true,
        "extractedFrom": "conversation-id",
        "tags": [],
        "subtasks": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "extractedEvents": [
      {
        "id": "event-id-1",
        "title": "Lunch meeting",
        "description": null,
        "startTime": "2024-01-03T12:00:00.000Z",
        "endTime": "2024-01-03T13:00:00.000Z",
        "location": null,
        "isAllDay": false,
        "calendarEventId": null,
        "calendarProvider": null,
        "aiGenerated": true,
        "budgetImpact": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "commitments": ["grab lunch Wednesday"]
  },
  "message": "Extracted 1 tasks and 1 events"
}
```

#### POST /ai/generate-tasks
Generate tasks using AI based on a prompt.

**Request Body:**
```json
{
  "prompt": "I need to prepare for my job interview next week",
  "context": {
    "currentTasks": ["task-1", "task-2"],
    "upcomingEvents": ["event-1"],
    "energyLevel": 7,
    "budgetStatus": "good"
  }
}
```

#### POST /ai/prioritize-tasks
Prioritize tasks using AI and Eisenhower Matrix.

**Request Body:**
```json
{
  "taskIds": ["task-id-1", "task-id-2", "task-id-3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-id-1",
      "title": "Urgent task",
      "priority": "URGENT",
      "reasoning": "This task has a deadline tomorrow and is critical for project success",
      "suggestedOrder": 1,
      "subtasks": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Prioritized 3 tasks"
}
```

#### POST /ai/chat
Chat with SyncScript AI assistant.

**Request Body:**
```json
{
  "message": "What should I focus on today?",
  "context": {
    "currentTasks": ["task-1"],
    "energyLevel": 6
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your current energy level of 6/10 and your pending tasks, I recommend focusing on the high-priority items first. You have 3 tasks due today, and I suggest starting with the quarterly report since it requires sustained focus.",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Financial

#### GET /financial/accounts
Get all connected financial accounts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "account-id",
      "userId": "user-id",
      "plaidItemId": "plaid-item-id",
      "accountId": "plaid-account-id",
      "accountName": "Chase Checking",
      "accountType": "checking",
      "balance": 2500.50,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /financial/accounts
Connect a new financial account.

**Request Body:**
```json
{
  "plaidItemId": "plaid-item-id",
  "accountId": "plaid-account-id",
  "accountName": "Chase Checking",
  "accountType": "checking",
  "balance": 2500.50
}
```

#### GET /financial/budget-status
Get current budget status and spending analysis.

**Query Parameters:**
- `period` (string): Analysis period (month, week, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 5000.00,
    "monthlyBudget": 3000.00,
    "spentThisMonth": 1200.50,
    "remainingBudget": 1799.50,
    "upcomingExpenses": 800.00,
    "alerts": [
      {
        "type": "low_budget",
        "message": "You have $1799.50 remaining in your budget",
        "amount": 1799.50,
        "severity": "medium"
      }
    ],
    "period": "month"
  }
}
```

#### GET /financial/analytics
Get spending analytics and trends.

**Query Parameters:**
- `period` (number): Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSpent": 1200.50,
    "dailySpending": [
      {
        "date": "2024-01-01",
        "amount": 45.50
      }
    ],
    "categorySpending": [
      {
        "category": "food",
        "amount": 300.00
      }
    ],
    "averageDailySpending": 40.02,
    "period": "30 days"
  }
}
```

#### GET /financial/recommendations
Get AI-powered budget recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "spending_rate",
        "title": "High Spending Rate",
        "message": "Your current spending rate would deplete your balance in 45 days",
        "severity": "high",
        "action": "Consider reducing discretionary spending"
      }
    ],
    "summary": {
      "totalBalance": 5000.00,
      "totalSpent": 1200.50,
      "dailySpendingRate": 40.02,
      "monthlyProjection": 1200.60,
      "yearlyProjection": 14607.30
    }
  }
}
```

### Notifications

#### GET /notifications
Get all notifications with filtering and pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by notification type
- `isRead`: Filter by read status
- `sortBy`: Sort field (createdAt, type, isRead)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "userId": "user-id",
      "type": "TASK_REMINDER",
      "title": "Task Reminder",
      "message": "Don't forget: Complete project proposal (due 2024-01-15)",
      "isRead": false,
      "actionUrl": "/tasks",
      "metadata": {
        "taskId": "task-id",
        "dueDate": "2024-01-15T00:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /notifications
Create a new notification.

**Request Body:**
```json
{
  "type": "TASK_REMINDER",
  "title": "Task Reminder",
  "message": "Don't forget: Complete project proposal",
  "actionUrl": "/tasks",
  "metadata": {
    "taskId": "task-id"
  }
}
```

#### PATCH /notifications/:id/read
Mark a notification as read.

#### PATCH /notifications/mark-all-read
Mark all notifications as read.

#### GET /notifications/unread/count
Get count of unread notifications.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### User Management

#### GET /user/profile
Get user profile information.

#### PUT /user/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe",
  "timezone": "UTC-8",
  "energyLevel": 7
}
```

#### GET /user/settings
Get user settings.

#### PUT /user/settings
Update user settings.

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "aiSchedulingEnabled": true,
  "aiBudgetAdviceEnabled": true,
  "aiEnergyAdaptation": true,
  "dataSharingEnabled": false,
  "workHoursStart": "09:00",
  "workHoursEnd": "17:00",
  "breakDuration": 15
}
```

#### POST /user/energy-level
Log daily energy level.

**Request Body:**
```json
{
  "level": 7,
  "notes": "Feeling good today, had a good night's sleep"
}
```

#### GET /user/energy-level
Get energy level history.

**Query Parameters:**
- `days` (number): Number of days to retrieve (default: 30)

#### GET /user/dashboard
Get dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "todayTasks": [ ... ],
    "upcomingEvents": [ ... ],
    "recentAchievements": [ ... ],
    "activeStreaks": [ ... ],
    "unreadNotifications": [ ... ]
  }
}
```

#### GET /user/stats
Get user statistics.

**Query Parameters:**
- `period` (number): Analysis period in days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 25,
      "completed": 18,
      "pending": 5,
      "inProgress": 2
    },
    "events": 12,
    "achievements": 3,
    "streaks": [
      {
        "id": "streak-id",
        "type": "daily_tasks",
        "count": 7,
        "lastDate": "2024-01-01T00:00:00.000Z"
      }
    ],
    "period": "30 days"
  }
}
```

## WebSocket Events

### Connection
Connect to WebSocket at `ws://localhost:3001`

### Events

#### join-user-room
Join user-specific room for personalized updates.
```json
{
  "event": "join-user-room",
  "data": "user-id"
}
```

#### task-updated
Real-time task updates.
```json
{
  "event": "task-updated",
  "data": {
    "taskId": "task-id",
    "status": "COMPLETED",
    "userId": "user-id"
  }
}
```

#### notification-created
New notification created.
```json
{
  "event": "notification-created",
  "data": {
    "id": "notification-id",
    "type": "TASK_REMINDER",
    "title": "Task Reminder",
    "message": "Don't forget: Complete project proposal"
  }
}
```

## Rate Limiting
- **Window:** 15 minutes
- **Limit:** 100 requests per window
- **Headers:** Rate limit information included in response headers

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
