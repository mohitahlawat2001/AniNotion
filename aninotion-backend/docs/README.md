# 📚 AniNotion

<div align="center">

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=28&duration=3000&pause=1000&color=61DAFB&center=true&vCenter=true&width=600&height=100&lines=AniNotion;📚+Track+Your+Anime+Journey;🎬+Manage+Your+Watchlist;📖+Journal+Your+Media;✨+Modern+%26+Beautiful)](https://git.io/typing-svg)

**A modern journal application for tracking anime, manga, and media consumption**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.15.1-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.8-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Code Style](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4?style=for-the-badge&logo=prettier)](https://prettier.io/)

</div>

## ✨ Features

### 📝 **Content Management**

- **Rich Post Creation** - Create detailed posts about anime, manga, and other media
- **Category Organization** - Organize content with customizable categories
- **Tag System** - Tag posts for easy discovery and filtering
- **Image Support** - Upload and manage multiple images per post
- **Draft System** - Save drafts and publish when ready

### 🔐 **Authentication & Authorization**

- **Google OAuth Integration** - Seamless login with Google accounts
- **Role-Based Access Control** - Admin, Editor, and Viewer roles
- **JWT Authentication** - Secure token-based authentication
- **User Management** - Admin dashboard for user administration

### 📊 **Analytics & Engagement**

- **View Tracking** - Automatic view counting for posts
- **Like System** - Community engagement features
- **Reading Time** - Automatic reading time calculation
- **SEO Optimization** - Auto-generated slugs and excerpts

### 🛠️ **Developer Experience**

- **RESTful API** - Well-documented API with comprehensive endpoints
- **Automated Backups** - Scheduled database backups with cloud storage
- **Comprehensive Logging** - Structured logging with Pino
- **Migration System** - Database migration tools for updates
- **CLI Tools** - Command-line utilities for administration

### 🎨 **Modern UI/UX**

- **Responsive Design** - Mobile-first responsive interface
- **Dark Theme** - Beautiful dark theme with glassmorphism effects
- **Infinite Scroll** - Smooth pagination with load-more functionality
- **Real-time Updates** - Dynamic content updates
- **Accessibility** - WCAG compliant interface

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** 4.4+
- **npm** or **yarn**

**OR**

- **Docker** & **Docker Compose** (recommended for easy setup)

### Installation

#### Option 1: Docker Setup (Recommended)

The easiest way to get started is using Docker:

1. **Clone the repository**

   ```bash
   git clone https://github.com/mohitahlawat2001/AniNotion.git
   cd AniNotion
   ```

2. **Set up environment variables**

   ```bash
   # Backend environment
   cp aninotion-backend/.env.example aninotion-backend/.env

   # Frontend environment
   cp aninotion-frontend/.env.example aninotion-frontend/.env
   ```

3. **Configure your environment**

   Edit `aninotion-backend/.env` with your actual credentials:
   - JWT_SECRET
   - Google OAuth credentials (optional for basic functionality)
   - Cloudinary credentials (optional for image uploads)
   - Other API keys as needed

   **Note:** The application will work with placeholder values from `.env.example`, but some features may be limited.

4. **Start the application with Docker**

   ```bash
   docker compose up -d
   ```

   This will:
   - Start MongoDB container
   - Build and start the backend API (http://localhost:5000)
   - Build and start the frontend (http://localhost:5173)

5. **Initialize the database** (first time only)

   ```bash
   docker compose exec backend npm run seed
   docker compose exec backend npm run migrate:v0.5
   ```

6. **Access the application**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - MongoDB: localhost:27017

**Docker Commands:**

```bash
# Stop all containers
docker compose down

# Stop and remove all volumes (database will be reset)
docker compose down -v

# View logs
docker compose logs -f

# Rebuild containers after code changes
docker compose up -d --build

# Execute commands in containers
docker compose exec backend npm run health
docker compose exec backend npm run backup
```

#### Option 2: Manual Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mohitahlawat2001/AniNotion.git
   cd AniNotion
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Backend environment
   cp aninotion-backend/.env.example aninotion-backend/.env

   # Frontend environment
   cp aninotion-frontend/.env.example aninotion-frontend/.env
   ```

4. **Configure your environment**

   Edit `aninotion-backend/.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/aninotion
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

5. **Initialize the database**

   ```bash
   npm run seed
   npm run migrate:v0.5
   ```

6. **Start the development servers**

   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:5000)

## 📁 Project Structure

```
aninotion-app/
├── 📁 aninotion-frontend/          # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable UI components
│   │   ├── 📁 pages/              # Page components
│   │   ├── 📁 context/            # React context providers
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   └── 📁 services/           # API service layer
│   ├── 📁 docs/                   # Frontend documentation
│   └── 📄 package.json
├── 📁 aninotion-backend/           # Node.js backend API
│   ├── 📁 config/                 # Configuration files
│   ├── 📁 models/                 # MongoDB models
│   ├── 📁 routes/                 # API route handlers
│   ├── 📁 middleware/             # Express middleware
│   ├── 📁 utils/                  # Utility functions
│   ├── 📁 scripts/                # CLI and maintenance scripts
│   ├── 📁 docs/                   # API documentation
│   └── 📄 package.json
├── 📁 .github/                    # GitHub templates and workflows
│   ├── 📁 ISSUE_TEMPLATE/         # Issue templates
│   └── 📁 PULL_REQUEST_TEMPLATE/  # PR templates
├── 📄 package.json                # Root package.json
├── 📄 README.md                   # This file
└── 📄 CONTRIBUTING.md             # Contribution guidelines
```

## 🔧 Available Scripts

### Root Level

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run seed` - Seed the database with initial data
- `npm run lint` - Run ESLint on the entire codebase
- `npm run format` - Format code with Prettier

### Backend Scripts

- `npm run start` - Start the backend server
- `npm run migrate` - Run database migrations
- `npm run backup` - Create a database backup
- `npm run health` - Check system health
- `npm run test:oauth` - Test OAuth endpoints

### Frontend Scripts

- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint on frontend code

## 🌐 API Documentation

The API is fully documented and follows RESTful conventions. Key endpoints include:

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user

### Posts

- `GET /api/posts` - List posts with pagination and filtering
- `POST /api/posts` - Create new post (Auth required)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post (Auth required)
- `DELETE /api/posts/:id` - Delete post (Auth required)

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (Admin only)

For complete API documentation, see [API_V0.5.md](aninotion-backend/docs/API_V0.5.md)

## 🔐 Authentication

AniNotion supports multiple authentication methods:

- **Google OAuth 2.0** - Primary authentication method
- **Local Authentication** - Email/password for admin accounts
- **JWT Tokens** - Secure session management

### User Roles

- **Admin** - Full system access and user management
- **Editor** - Create, edit, and manage own content
- **Viewer** - Read-only access to published content

## 🎨 Tech Stack

### Frontend

- **React 19** - Modern React with latest features
- **Vite** - Lightning-fast build tool
- **TailwindCSS 4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library

### Backend

- **Node.js** - JavaScript runtime
- **Express 5** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for auth
- **Pino** - High-performance logging
- **Cloudinary** - Image storage and processing

### DevOps & Tools

- **Docker** - Containerization for easy deployment
- **Docker Compose** - Multi-container orchestration
- **Husky** - Git hooks for code quality
- **lint-staged** - Run linters on staged files
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions are valued.

### Quick Start for Contributors

1. **Fork & Clone** the repository
2. **Set up** your development environment
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

For detailed instructions, please see our [**Contributing Guide**](CONTRIBUTING.md) which covers:

- 🛠️ **Development Setup** - Complete environment configuration
- 📋 **Code Guidelines** - Style conventions and best practices
- 🧪 **Testing** - How to write and run tests
- 📝 **Pull Request Process** - Step-by-step submission guide
- 🐛 **Issue Reporting** - How to report bugs effectively
- 🎨 **Design Guidelines** - UI/UX contribution standards

### Ways to Contribute

- 🐛 **Report Bugs** - Help us identify and fix issues
- ✨ **Suggest Features** - Share ideas for new functionality
- 📚 **Improve Docs** - Make our documentation better
- 🧪 **Write Tests** - Increase code coverage and reliability
- 🎨 **Design UI/UX** - Enhance user experience
- 🔧 **Code Review** - Help review pull requests

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anime Database API** - For anime information and metadata
- **Google OAuth** - For secure authentication
- **Cloudinary** - For image storage and processing
- **MongoDB Atlas** - For database hosting
- **Vercel** - For frontend deployment

## 📞 Support

- 📧 **Email**: support@aninotion.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/mohitahlawat2001/AniNotion/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mohitahlawat2001/AniNotion/discussions)

---

<div align="center">

**Made with ❤️ by the AniNotion Team**

[⭐ Star this repo](https://github.com/mohitahlawat2001/AniNotion) • [🐛 Report Bug](https://github.com/mohitahlawat2001/AniNotion/issues) • [✨ Request Feature](https://github.com/mohitahlawat2001/AniNotion/issues)

</div>
