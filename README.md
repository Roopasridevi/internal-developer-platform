# Internal Developer Platform (IDP)

A comprehensive internal developer platform for managing projects, CI/CD pipelines, deployments, and logs.

## 🚀 Overview

This platform provides a unified interface for developers to:
- Manage projects and repositories
- Create and configure CI/CD pipelines
- Deploy applications to multiple environments
- Monitor logs and application health

## 📁 Project Structure

```
idp-platform/
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── app.js          # Application entry
│   ├── tests/              # Backend tests
│   ├── migrations/         # Database migrations
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   ├── assets/         # Static assets
│   │   └── App.jsx         # Root component
│   ├── tests/              # Frontend tests
│   ├── public/             # Public assets
│   └── package.json
├── pipelines/              # CI/CD configurations
│   ├── build.yml
│   ├── test.yml
│   ├── deploy.yml
│   ├── quality-gate.yml
│   └── pr-validation.yml
├── docs/                   # Documentation
│   ├── api/
│   ├── architecture/
│   └── guides/
└── .github/                # GitHub configurations
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Validation**: Joi
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **UI Components**: Custom components
- **Styling**: CSS Modules / Tailwind CSS
- **Testing**: Vitest, React Testing Library

### DevOps
- **CI/CD**: YAML-based pipelines
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus, Grafana

## 🚦 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- PostgreSQL 14+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd idp-platform
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npm run migrate
   ```

### Development

**Start backend server:**
```bash
cd backend
npm run dev
```

**Start frontend development server:**
```bash
cd frontend
npm run dev
```

The backend API will be available at `http://localhost:3000`
The frontend will be available at `http://localhost:5173`

### Testing

**Run backend tests:**
```bash
cd backend
npm test
```

**Run frontend tests:**
```bash
cd frontend
npm test
```

### Linting

**Lint backend code:**
```bash
cd backend
npm run lint
```

**Lint frontend code:**
```bash
cd frontend
npm run lint
```

**Format code:**
```bash
npm run format
```

## 📚 Modules

### 1. Project Management
- Create and manage projects
- Repository integration
- Team member management
- Project settings and configurations

### 2. CI Pipeline Creation
- Visual pipeline builder
- Template-based pipeline creation
- Custom stage and job configuration
- Pipeline versioning

### 3. Deployment System
- Multi-environment deployments
- Rollback capabilities
- Deployment history
- Environment variable management

### 4. Logs Dashboard
- Real-time log streaming
- Log filtering and search
- Log aggregation
- Error tracking and alerts

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

## 📖 Documentation

- [API Documentation](./docs/api/README.md)
- [Architecture Guide](./docs/architecture/README.md)
- [Development Guide](./docs/guides/development.md)
- [Deployment Guide](./docs/guides/deployment.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

For support and questions, please contact the platform team.
