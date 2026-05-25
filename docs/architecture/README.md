# Architecture Documentation

## System Overview

The Internal Developer Platform (IDP) is a comprehensive solution for managing the entire software development lifecycle, from project creation to deployment and monitoring.

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Frontend (React)                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Projects | Pipelines | Deployments | Logs  │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
                         REST API
                            │
┌────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controllers → Services → Models → DB  │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴───────────────────┐
          │                                    │
    ┌──────┴──────┐                  ┌──────┴──────┐
    │  Database  │                  │  External  │
    │ PostgreSQL│                  │  Services  │
    └─────────────┘                  └─────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                  │
                    ┌─────┴─────┐  ┌─────┴─────┐
                    │   Git   │  │ K8s/CI │
                    │Provider│  │ Runner │
                    └───────────┘  └───────────┘
```

## Components

### Frontend Layer

**Technology**: React 18 + Vite

**Responsibilities**:
- User interface rendering
- State management (React Context + Hooks)
- API communication
- Client-side routing

**Key Features**:
- Responsive design
- Real-time updates (SSE for logs)
- Optimistic UI updates
- Code splitting and lazy loading

### Backend Layer

**Technology**: Node.js + Express.js

**Architecture Pattern**: Layered Architecture

**Layers**:
1. **Routes**: API endpoint definitions
2. **Controllers**: Request/response handling
3. **Services**: Business logic
4. **Models**: Data access layer
5. **Middleware**: Cross-cutting concerns

**Key Features**:
- JWT authentication
- Role-based access control
- Request validation
- Error handling
- Logging

### Database Layer

**Technology**: PostgreSQL 14+

**ORM**: Sequelize

**Schema**:
- Users
- Projects
- Project Members
- Pipelines
- Pipeline Executions
- Deployments
- Environments
- Logs

### External Services

1. **Git Provider** (GitHub/GitLab)
   - Repository management
   - Webhook integration

2. **CI Runner**
   - Pipeline execution
   - Build automation

3. **Kubernetes**
   - Container orchestration
   - Deployment management

## Data Flow

### Project Creation Flow

```
User → Frontend → API → Controller → Service → Model → Database
                                    │
                                    ↓
                              Git Provider API
```

### Pipeline Execution Flow

```
User → Frontend → API → Controller → Service → CI Runner
                                    │
                                    ↓
                              Database (Status)
                                    │
                                    ↓
                              Logs Collection
```

### Deployment Flow

```
User → Frontend → API → Controller → Service → Kubernetes API
                                    │
                                    ↓
                              Database (Status)
                                    │
                                    ↓
                              Monitoring/Logs
```

## Security

### Authentication
- JWT-based authentication
- Access token (short-lived)
- Refresh token (long-lived)
- Token rotation

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Project membership validation

### API Security
- HTTPS only in production
- CORS configuration
- Rate limiting
- Input validation and sanitization
- SQL injection prevention (ORM)
- XSS protection

## Scalability

### Horizontal Scaling
- Stateless backend servers
- Load balancer distribution
- Database connection pooling

### Caching Strategy
- Client-side caching (React Query)
- API response caching
- Database query optimization

### Performance Optimization
- Database indexing
- Query optimization
- Pagination
- Lazy loading
- Code splitting

## Monitoring and Observability

### Metrics
- Application metrics (Prometheus)
- System metrics (CPU, Memory, Disk)
- Custom business metrics

### Logging
- Structured logging (Winston)
- Log aggregation
- Log levels (error, warn, info, debug)

### Tracing
- Request tracing
- Performance monitoring
- Error tracking

## Deployment Architecture

### Environments
1. **Development**: Local development
2. **Staging**: Pre-production testing
3. **Production**: Live environment

### Infrastructure
- Kubernetes cluster
- PostgreSQL database
- Load balancer
- Container registry

### CI/CD Pipeline
1. Code commit
2. Automated tests
3. Quality checks
4. Build Docker images
5. Deploy to staging
6. Manual approval
7. Deploy to production
8. Smoke tests
9. Monitoring
