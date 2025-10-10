# 🤝 Contributing to AniNotion

Thank you for your interest in contributing to AniNotion! This guide will help you get started with the development setup and contribution process.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Getting Help](#getting-help)

## 🛠️ Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Local installation](https://docs.mongodb.com/manual/installation/) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download here](https://git-scm.com/)

### Step-by-Step Setup

1. **Fork and Clone the Repository**

   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/aninotion.git
   cd aninotion
   ```

2. **Install Root Dependencies**

   ```bash
   npm install
   ```

3. **Install Backend Dependencies**

   ```bash
   cd aninotion-backend
   npm install
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd ../aninotion-frontend
   npm install
   cd ..
   ```

## 🔧 Environment Configuration

### Backend Environment Setup

1. **Create Backend Environment File**

   ```bash
   cd aninotion-backend
   touch .env
   ```

2. **Configure Backend Environment Variables**

   Add the following to `aninotion-backend/.env`:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/aninotion
   # Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/aninotion

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   LOG_LEVEL=info
   APP_NAME=aninotion

   # Cloudinary Configuration (Required for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # MyAnimeList API (Optional - for anime features)
   MYANIME_LIST_CLIENT_ID=your-mal-client-id

   # Email Configuration (Optional)
   RESEND_API_KEY=your-resend-api-key

   # Redis Configuration (Optional - for caching)
   UPSTASH_REDIS_REST_URL=your-redis-url
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

### Getting Required API Keys

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

#### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret to your `.env` file

#### MyAnimeList API Setup (Optional)

1. Go to [MyAnimeList API](https://myanimelist.net/apiconfig)
2. Create a new client
3. Copy Client ID to your `.env` file

#### MongoDB Setup

Choose one of the following options:

**Option 1: Local MongoDB**

1. Install MongoDB locally
2. Start MongoDB service
3. Use `MONGODB_URI=mongodb://localhost:27017/aninotion`

**Option 2: MongoDB Atlas (Recommended)**

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`

### Frontend Environment Setup

The frontend uses Vite and doesn't require a separate `.env` file for basic development. API endpoints are configured in the source code to point to `http://localhost:5000` by default.

## 🏗️ Project Structure

```
aninotion/
├── 📁 aninotion-backend/          # Express.js API Server
│   ├── 📁 config/                 # Configuration files
│   │   ├── database.js            # MongoDB connection
│   │   ├── logger.js              # Logging configuration
│   │   └── passport.js            # Authentication setup
│   ├── 📁 middleware/             # Custom middleware
│   │   ├── auth.js                # Authentication middleware
│   │   └── logging.js             # Request logging
│   ├── 📁 models/                 # MongoDB schemas
│   │   ├── User.js                # User model
│   │   ├── Post.js                # Post model
│   │   └── Category.js            # Category model
│   ├── 📁 routes/                 # API endpoints
│   │   ├── auth.js                # Authentication routes
│   │   ├── posts.js               # Post management
│   │   ├── categories.js          # Category management
│   │   ├── users.js               # User management
│   │   └── anime.js               # MyAnimeList integration
│   ├── 📁 utils/                  # Helper utilities
│   │   ├── imageProcessor.js      # Image upload handling
│   │   ├── postHelpers.js         # Post-related utilities
│   │   └── backupScheduler.js     # Database backup
│   ├── 📁 scripts/                # Utility scripts
│   └── 📄 server.js               # Main server file
├── 📁 aninotion-frontend/         # React.js Client
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 pages/              # Page components
│   │   ├── 📁 context/            # React contexts
│   │   │   ├── AuthContext.jsx    # Authentication state
│   │   │   └── LayoutContext.jsx  # Layout state
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 services/           # API service functions
│   │   └── 📁 assets/             # Static assets
│   ├── 📄 vite.config.js          # Vite configuration
│   ├── 📄 tailwind.config.js      # TailwindCSS configuration
│   └── 📄 package.json            # Frontend dependencies
├── 📁 .husky/                     # Git hooks
└── 📄 package.json                # Root package configuration
```

## 🚀 Development Workflow

### Starting the Development Environment

1. **Start Both Servers (Recommended)**

   ```bash
   # From root directory
   npm run dev
   ```

   This starts both backend (port 5000) and frontend (port 3000) concurrently.

2. **Start Servers Individually**

   ```bash
   # Backend only
   npm run server

   # Frontend only
   npm run client
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only

# Code Quality
npm run lint         # Lint all code
npm run lint:frontend # Lint frontend only
npm run lint:backend  # Lint backend only
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Database
npm run seed         # Seed database with default categories

# Git Hooks
npm run prepare      # Install Husky git hooks
```

### Database Seeding

After setting up your environment, seed the database with default categories:

```bash
npm run seed
```

This creates default categories like "Anime", "Manga", "Movies", etc.

## 📝 Code Standards

### Code Style

- **ESLint** - We use ESLint for code linting
- **Prettier** - Code formatting is handled by Prettier
- **Husky** - Git hooks ensure code quality before commits

### Naming Conventions

- **Files**: Use kebab-case for file names (`user-service.js`)
- **Components**: Use PascalCase for React components (`UserProfile.jsx`)
- **Variables**: Use camelCase for variables and functions (`getUserData`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (`API_BASE_URL`)

### Commit Messages

Follow conventional commit format:

```
type(scope): description

Examples:
feat(auth): add Google OAuth integration
fix(posts): resolve image upload issue
docs(readme): update installation guide
style(frontend): improve responsive design
```

### Code Quality Checks

Before committing, the following checks run automatically:

- ESLint for code quality
- Prettier for code formatting
- Pre-push hooks prevent pushing broken code

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd aninotion-backend
npm test

# Frontend tests
cd aninotion-frontend
npm test
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for good test coverage on critical paths

## 📤 Submitting Changes

### Pull Request Process

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**

   ```bash
   npm run lint
   npm run format:check
   npm test
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat(scope): your descriptive commit message"
   ```

5. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a pull request
   - Fill out the PR template
   - Link any related issues
   - Request review from maintainers

### Pull Request Guidelines

- **Title**: Use descriptive titles that explain what the PR does
- **Description**: Provide context about what changes were made and why
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Describe how you tested your changes
- **Breaking Changes**: Clearly mark any breaking changes

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots or error messages
- Environment details (OS, Node version, etc.)

### Feature Requests

For feature requests, please include:

- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any relevant mockups or examples

## 🆘 Getting Help

### Communication Channels

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Pull Request Comments** - For code review discussions

### Development Tips

1. **Database Issues**
   - Make sure MongoDB is running
   - Check connection string in `.env`
   - Try clearing the database and re-seeding

2. **Authentication Issues**
   - Verify Google OAuth credentials
   - Check callback URLs match exactly
   - Ensure JWT_SECRET is set

3. **Image Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS configuration

4. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Useful Commands

```bash
# Reset everything
rm -rf node_modules aninotion-backend/node_modules aninotion-frontend/node_modules
npm install

# Check logs
cd aninotion-backend
npm run dev # Check console for detailed logs

# Database operations
npm run seed # Seed database
# Use MongoDB Compass or CLI to inspect database
```

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to AniNotion! Your efforts help make this project better for everyone. 🙏
