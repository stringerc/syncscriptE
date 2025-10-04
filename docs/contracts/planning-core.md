# Planning Core Context Contract

## Public API

### Task Management Endpoints

#### GET /api/tasks
Get user's tasks with optional filtering.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: Filter by task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, DEFERRED)
- `priority`: Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `eventId`: Filter by linked event ID
- `dueDate`: Filter by due date (ISO 8601)
- `limit`: Number of tasks to return (default: 50, max: 100)
- `offset`: Number of tasks to skip (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "priority": "MEDIUM",
        "status": "PENDING",
        "dueDate": "2024-01-01T00:00:00Z",
        "estimatedDuration": 30,
        "actualDuration": null,
        "energyRequired": 5,
        "budgetImpact": 0.0,
        "scheduledAt": null,
        "completedAt": null,
        "location": "string",
        "type": "PREPARATION",
        "tags": "string",
        "eventId": "string",
        "event": {
          "id": "string",
          "title": "string"
        },
        "subtasks": [
          {
            "id": "string",
            "title": "string",
            "completed": false,
            "order": 1
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "hasMore": false
  }
}
```

#### POST /api/tasks
Create a new task.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "priority": "MEDIUM",
  "dueDate": "2024-01-01T00:00:00Z",
  "estimatedDuration": 30,
  "energyRequired": 5,
  "budgetImpact": 0.0,
  "location": "string",
  "type": "PREPARATION",
  "tags": "string",
  "eventId": "string",
  "subtasks": [
    {
      "title": "string",
      "order": 1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "priority": "MEDIUM",
    "status": "PENDING",
    "dueDate": "2024-01-01T00:00:00Z",
    "estimatedDuration": 30,
    "energyRequired": 5,
    "budgetImpact": 0.0,
    "location": "string",
    "type": "PREPARATION",
    "tags": "string",
    "eventId": "string",
    "subtasks": [
      {
        "id": "string",
        "title": "string",
        "completed": false,
        "order": 1
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/tasks/:id
Get a specific task by ID.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "priority": "MEDIUM",
    "status": "PENDING",
    "dueDate": "2024-01-01T00:00:00Z",
    "estimatedDuration": 30,
    "actualDuration": null,
    "energyRequired": 5,
    "budgetImpact": 0.0,
    "scheduledAt": null,
    "completedAt": null,
    "location": "string",
    "type": "PREPARATION",
    "tags": "string",
    "eventId": "string",
    "event": {
      "id": "string",
      "title": "string"
    },
    "subtasks": [
      {
        "id": "string",
        "title": "string",
        "completed": false,
        "order": 1
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/tasks/:id
Update a task.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2024-01-01T00:00:00Z",
  "estimatedDuration": 45,
  "actualDuration": 30,
  "energyRequired": 7,
  "budgetImpact": 25.0,
  "location": "string",
  "type": "PREPARATION",
  "tags": "string",
  "eventId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "dueDate": "2024-01-01T00:00:00Z",
    "estimatedDuration": 45,
    "actualDuration": 30,
    "energyRequired": 7,
    "budgetImpact": 25.0,
    "location": "string",
    "type": "PREPARATION",
    "tags": "string",
    "eventId": "string",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/tasks/:id
Delete a task (soft delete).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "deletedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/tasks/:id/convert-to-prep
Convert a standalone task to a preparation task for an event.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "eventId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "eventId": "string",
    "event": {
      "id": "string",
      "title": "string"
    },
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/tasks/:id/remove-from-event
Remove a task from its linked event.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "eventId": null,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Event Management Endpoints

#### GET /api/events
Get user's events with optional filtering.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `startDate`: Filter events starting from this date (ISO 8601)
- `endDate`: Filter events ending before this date (ISO 8601)
- `isAllDay`: Filter by all-day events (true/false)
- `location`: Filter by location
- `limit`: Number of events to return (default: 50, max: 100)
- `offset`: Number of events to skip (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "startTime": "2024-01-01T00:00:00Z",
        "endTime": "2024-01-01T01:00:00Z",
        "location": "string",
        "isAllDay": false,
        "calendarEventId": "string",
        "calendarProvider": "google",
        "budgetImpact": 0.0,
        "preparationTasks": [
          {
            "id": "string",
            "title": "string",
            "status": "PENDING"
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "hasMore": false
  }
}
```

#### POST /api/events
Create a new event.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T01:00:00Z",
  "location": "string",
  "isAllDay": false,
  "budgetImpact": 0.0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T01:00:00Z",
    "location": "string",
    "isAllDay": false,
    "budgetImpact": 0.0,
    "preparationTasks": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/events/:id
Get a specific event by ID.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T01:00:00Z",
    "location": "string",
    "isAllDay": false,
    "calendarEventId": "string",
    "calendarProvider": "google",
    "budgetImpact": 0.0,
    "preparationTasks": [
      {
        "id": "string",
        "title": "string",
        "status": "PENDING",
        "priority": "MEDIUM",
        "dueDate": "2024-01-01T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/events/:id
Update an event.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T01:00:00Z",
  "location": "string",
  "isAllDay": false,
  "budgetImpact": 0.0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T01:00:00Z",
    "location": "string",
    "isAllDay": false,
    "budgetImpact": 0.0,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/events/:id
Delete an event.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "deletedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Events Emitted

### task.created
Emitted when a new task is created.

**Event Data**:
```json
{
  "taskId": "string",
  "userId": "string",
  "title": "string",
  "priority": "MEDIUM",
  "status": "PENDING",
  "eventId": "string",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### task.updated
Emitted when a task is updated.

**Event Data**:
```json
{
  "taskId": "string",
  "userId": "string",
  "changes": {
    "status": "IN_PROGRESS",
    "priority": "HIGH"
  },
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### task.completed
Emitted when a task is marked as completed.

**Event Data**:
```json
{
  "taskId": "string",
  "userId": "string",
  "title": "string",
  "completedAt": "2024-01-01T00:00:00Z",
  "actualDuration": 30,
  "energyRequired": 5
}
```

### task.deleted
Emitted when a task is deleted.

**Event Data**:
```json
{
  "taskId": "string",
  "userId": "string",
  "deletedAt": "2024-01-01T00:00:00Z"
}
```

### event.created
Emitted when a new event is created.

**Event Data**:
```json
{
  "eventId": "string",
  "userId": "string",
  "title": "string",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T01:00:00Z",
  "location": "string",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### event.updated
Emitted when an event is updated.

**Event Data**:
```json
{
  "eventId": "string",
  "userId": "string",
  "changes": {
    "title": "string",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-01T01:00:00Z"
  },
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### event.deleted
Emitted when an event is deleted.

**Event Data**:
```json
{
  "eventId": "string",
  "userId": "string",
  "deletedAt": "2024-01-01T00:00:00Z"
}
```

## Events Consumed

### user.created
Consumed to initialize user's default tasks and events.

**Handler**: Creates welcome tasks and sample events for new users.

## Invariants

1. **Task Ownership**: All tasks must belong to a user
2. **Event Time Validity**: Events must have valid start and end times
3. **Task-Event Linking**: Tasks can be linked to events as preparation tasks
4. **Subtask Hierarchy**: Subtasks must belong to a parent task
5. **Status Transitions**: Task status transitions must be valid
6. **Energy Points**: Task completion triggers energy point awards
7. **Soft Deletion**: Tasks and events are soft-deleted, not permanently removed
8. **Time Consistency**: All timestamps are stored in UTC

## Error Codes

### Task Errors
- `TASK_NOT_FOUND`: Task with specified ID does not exist
- `TASK_INVALID_STATUS`: Task status is not valid
- `TASK_INVALID_PRIORITY`: Task priority is not valid
- `TASK_INVALID_DURATION`: Task duration must be positive
- `TASK_EVENT_NOT_FOUND`: Linked event does not exist
- `TASK_UPDATE_FAILED`: Failed to update task

### Event Errors
- `EVENT_NOT_FOUND`: Event with specified ID does not exist
- `EVENT_INVALID_TIME`: Event start time must be before end time
- `EVENT_INVALID_DATE`: Event date is not valid
- `EVENT_UPDATE_FAILED`: Failed to update event
- `EVENT_DELETE_FAILED`: Failed to delete event

### General Errors
- `INVALID_REQUEST`: Request body is malformed
- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User does not have permission to access resource
- `RATE_LIMITED`: Too many requests

## Rate Limiting

- **Task Operations**: 100 requests per minute per user
- **Event Operations**: 50 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user

## Security Considerations

1. **User Isolation**: Users can only access their own tasks and events
2. **Input Validation**: All input is validated and sanitized
3. **SQL Injection Prevention**: All queries use parameterized statements
4. **XSS Prevention**: All output is properly escaped
5. **Rate Limiting**: Applied to prevent abuse
6. **Audit Logging**: All operations are logged for security monitoring
