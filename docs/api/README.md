# API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.idp.example.com/api
```

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

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
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Project Endpoints

#### List Projects

```http
GET /projects?page=1&limit=10&search=term&status=active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### Create Project

```http
POST /projects
```

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "repositoryUrl": "https://github.com/org/repo"
}
```

#### Get Project

```http
GET /projects/:id
```

#### Update Project

```http
PUT /projects/:id
```

#### Delete Project

```http
DELETE /projects/:id
```

### Pipeline Endpoints

#### List Pipelines

```http
GET /pipelines?projectId=uuid&page=1&limit=10
```

#### Create Pipeline

```http
POST /pipelines
```

**Request Body:**
```json
{
  "name": "Build Pipeline",
  "projectId": "uuid",
  "config": {
    "stages": [
      {
        "name": "build",
        "steps": [...]
      }
    ]
  }
}
```

#### Execute Pipeline

```http
POST /pipelines/:id/execute
```

#### Get Pipeline Executions

```http
GET /pipelines/:id/executions
```

### Deployment Endpoints

#### List Deployments

```http
GET /deployments?projectId=uuid&environment=production&status=deployed
```

#### Create Deployment

```http
POST /deployments
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "environment": "production",
  "version": "1.0.0",
  "imageUrl": "registry.io/image:tag"
}
```

#### Rollback Deployment

```http
POST /deployments/:id/rollback
```

### Logs Endpoints

#### Get Logs

```http
GET /logs?projectId=uuid&level=error&startTime=2024-01-01&endTime=2024-01-31
```

#### Stream Logs (SSE)

```http
GET /logs/stream?deploymentId=uuid
```

#### Export Logs

```http
GET /logs/export?projectId=uuid&format=json
```

## Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
