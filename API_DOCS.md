# AvcLedger API Documentation

Base URL: `http://localhost:3000`

---

## Authentication (`/api/auth`)

### Convert Google Token to JWT
Exchanges a valid Google OAuth ID token for an internal AvcLedger JWT token.

- **Method:** `POST /api/auth/google`
- **Headers:** `Content-Type: application/json`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJSUzI1NiIs..." 
  }'
```

#### Example Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65f1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "google"
  }
}
```

### Logout
Invalidates the current JWT. The token is added to a blocklist and auto-purged when it expires.

- **Method:** `POST /api/auth/logout`
- **Headers:** `Authorization: Bearer <JWT>`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "message": "Logged out successfully"
}
```

---

## Projects (`/api/projects`)
*Requires `Authorization: Bearer <JWT>`*

### List Projects
Retrieves all projects owned by the authenticated user.

- **Method:** `GET /api/projects`

#### Example Request
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
[
  {
    "_id": "65f9876543210",
    "name": "Production App",
    "apiKey": "lf_1234567890abcdef...",
    "createdAt": "2024-03-29T10:00:00.000Z",
    "monthlyLogStats": {
      "info": 120,
      "warning": 15,
      "error": 5,
      "critical": 1,
      "debug": 45,
      "total": 186
    }
  }
]
```

### List API Keys
Retrieves the API key for a project (masked for security).

- **Method:** `GET /api/projects/:projectId/keys`
- **Headers:** `Authorization: Bearer YOUR_JWT_TOKEN`

#### Example Response
```json
{
  "apiKey": "lf_1234567890abcdef...",
  "maskedApiKey": "lf_********************abcdef..."
}
```

### Create Project
Creates a new project and returns a unique `apiKey` for log ingestion.

- **Method:** `POST /api/projects`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production App"
  }'
```

#### Example Response
```json
{
  "_id": "65f9876543210",
  "name": "Production App",
  "apiKey": "lf_1234567890abcdef...",
  "userId": "65f1234567890"
}
```

### Regenerate API Key
Revokes the old API key and generates a new one.

- **Method:** `POST /api/projects/:projectId/keys`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/projects/65f9876543210/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "apiKey": "lf_new9876543210fedcba..."
}
```

---

## Logs Ingestion (`/api/ingest`)
*Requires `Authorization: Bearer <API_KEY>` or `x-api-key: <API_KEY>`*

### Ingest Log
Records a new log and triggers any configured workflows asynchronously.

- **Method:** `POST /api/ingest`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "message": "Payment gateway timeout",
    "environment": "production",
    "metadata": { "userId": "user_881" }
  }'
```

#### Example Response (`202 Accepted`)
```json
{
  "message": "Log ingested successfully",
  "id": "65f8888888888"
}
```

---

## Logs Retrieval (`/api/projects/:projectId/logs`)
*Requires `Authorization: Bearer <JWT>`*

### Fetch Logs
Retrieves paginated logs for a specific project. Supports filtering and pagination.

- **Method:** `GET /api/projects/:projectId/logs?page=1&limit=50&level=error`

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/projects/65f9876543210/logs?page=1&limit=10&level=error" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "data": [
    {
      "_id": "65f8888888888",
      "projectId": "65f9876543210",
      "level": "error",
      "message": "Payment gateway timeout",
      "environment": "production",
      "timestamp": "2024-03-29T10:05:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Workflows (`/api/projects/:projectId/workflows`)
*Requires `Authorization: Bearer <JWT>`*

### List Workflows
Retrieves all workflows for a specific project.

- **Method:** `GET /api/projects/:projectId/workflows`

#### Example Request
```bash
curl -X GET http://localhost:3000/api/projects/65f9876543210/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
[
  {
    "_id": "65f7777777777",
    "projectId": "65f9876543210",
    "triggerLevel": "error",
    "providerType": "discord",
    "providerConfig": { "webhookUrl": "..." },
    "isActive": true
  }
]
```

### Create Workflow Rule
Creates a routing rule to forward matching logs to third-party providers (e.g., Discord).

- **Method:** `POST /api/projects/:projectId/workflows`

#### Example Request
```bash
curl -X POST http://localhost:3000/api/projects/65f9876543210/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "triggerLevel": "error",
    "providerType": "discord",
    "providerConfig": { "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL" },
    "isActive": true
  }'
```

#### Example Response
```json
{
  "_id": "65f7777777777",
  "projectId": "65f9876543210",
  "triggerLevel": "error",
  "providerType": "discord",
  "providerConfig": { "webhookUrl": "..." },
  "isActive": true
}
```

### Get Single Workflow
Retrieves details of a specific workflow.

- **Method:** `GET /api/projects/:projectId/workflows/:workflowId`

#### Example Request
```bash
curl -X GET http://localhost:3000/api/projects/65f9876543210/workflows/65f7777777777 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Edit Workflow
Updates an existing workflow rule.

- **Method:** `PATCH /api/projects/:projectId/workflows/:workflowId`

#### Example Request
```bash
curl -X PATCH http://localhost:3000/api/projects/65f9876543210/workflows/65f7777777777 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "triggerLevel": "*"
  }'
```

#### Example Response
```json
{
  "_id": "65f7777777777",
  "isActive": false,
  "triggerLevel": "*"
}
```

### Delete Workflow
Removes a workflow rule.

- **Method:** `DELETE /api/projects/:projectId/workflows/:workflowId`

#### Example Request
```bash
curl -X DELETE http://localhost:3000/api/projects/65f9876543210/workflows/65f7777777777 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Example Response
```json
{
  "message": "Workflow deleted"
}
```
