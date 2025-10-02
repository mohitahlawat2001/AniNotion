# AniNotion 📚✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.1.0-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green.svg)](https://mongodb.com/)
[![MyAnimeList API](https://img.shields.io/badge/MyAnimeList-API-blue.svg)](https://myanimelist.net/apiconfig/references/api/v2)

> A modern journal application for logging and tracking anime, manga, and other media you watch and read, with intelligent anime integration powered by the MyAnimeList API.

## 🌟 What is AniNotion?

AniNotion is a comprehensive digital journal designed specifically for anime and media enthusiasts. It combines the simplicity of note-taking with the power of anime data integration, allowing users to create rich, detailed logs of their viewing experiences with automatic anime information retrieval, ratings, and comprehensive metadata.

### 🎯 Why AniNotion?

- **Centralized Media Logging**: Keep all your anime, manga, and media consumption in one organized place
- **Intelligent Anime Integration**: Automatic anime data fetching from MyAnimeList with rich metadata
- **Flexible Post System**: Create detailed posts with images, categories, and custom content
- **User Management**: Role-based access control with admin, editor, and viewer roles
- **Responsive Design**: Beautiful, modern UI that works seamlessly across all devices
- **Professional Backend**: Robust API with authentication, backup systems, and comprehensive logging

## ✨ Key Features

### 📝 **Smart Journaling**
- Create rich posts with text, images, and multimedia content
- Organize content with customizable categories
- Advanced post lifecycle management with timestamps and user tracking

### 🎌 **Anime Integration**
- **Intelligent Anime Matching**: Automatic anime search and data retrieval
- **Comprehensive Anime Data**: Ratings, rankings, episode counts, studios, genres, and more
- **MyAnimeList Integration**: Direct integration with the world's largest anime database
- **Seasonal Anime Discovery**: Browse current and upcoming anime by season
- **Ranking Systems**: Access top-rated, popular, and trending anime lists

### 👥 **User Management**
- **Role-Based Access Control**: Admin, Editor, and Viewer roles with appropriate permissions
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Comprehensive user management system

### 🎨 **Modern Frontend**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Components**: Dynamic anime cards, search interfaces, and galleries
- **Loading States**: Smooth loading experiences with shimmer effects
- **Context Management**: Efficient state management with React Context

### 🛠 **Professional Backend**
- **RESTful API**: Clean, well-documented API endpoints
- **Database Management**: MongoDB with Mongoose ODM
- **Backup Systems**: Automatic and manual backup capabilities
- **Comprehensive Logging**: Structured logging with Pino
- **Migration System**: Database migration and versioning support
- **CLI Tools**: Command-line interface for system management

## 🚀 Tech Stack

### **Frontend**
- **React 19.1.0** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **React Router 7.6.1** - Client-side routing
- **React Hook Form 7.56.4** - Form handling and validation
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API communication

### **Backend**
- **Node.js** - JavaScript runtime
- **Express 5.1.0** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8.15.1** - MongoDB object modeling
- **JSON Web Tokens** - Secure authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image storage and optimization

### **External APIs**
- **MyAnimeList API v2** - Anime data and metadata
- **Resend** - Email services
- **Upstash Redis** - Caching and session management

### **DevOps & Tools**
- **Pino** - High-performance logging
- **Node-cron** - Scheduled tasks
- **Commander.js** - CLI interface
- **Nodemon** - Development server
- **Concurrently** - Parallel script execution

## 📦 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** database (local or cloud)
- **MyAnimeList API Client ID** ([Get one here](https://myanimelist.net/apiconfig))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/AniNotion.git
cd AniNotion
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd aninotion-backend
npm install

# Install frontend dependencies
cd ../aninotion-frontend
npm install

# Return to root directory
cd ..
```

### 3. Environment Configuration

Create environment files for both backend and frontend:

#### Backend Environment (`.env` in `aninotion-backend/`)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/aninotion
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aninotion

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# MyAnimeList API
MYANIME_LIST_CLIENT_ID=your-mal-client-id

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional - for notifications)
RESEND_API_KEY=your-resend-api-key

# Redis (optional - for caching)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Logging
LOG_LEVEL=info
APP_NAME=aninotion
```

#### Frontend Environment (`.env` in `aninotion-frontend/`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Database Setup

Initialize the database with default categories and admin user:

```bash
# Seed categories
cd aninotion-backend
npm run seed:admin

# Set up admin user (follow prompts)
npm run cli user:create-admin
```

### 5. Start the Application

#### Development Mode
```bash
# From root directory - starts both backend and frontend
npm run dev

# Or start individually:
npm run server  # Backend only (http://localhost:5000)
npm run client  # Frontend only (http://localhost:5173)
```

#### Production Mode
```bash
# Backend
cd aninotion-backend
npm start

# Frontend (build and serve)
cd aninotion-frontend
npm run build
npm run preview
```

## 🎮 Usage Examples

### Creating Your First Post

1. **Sign In**: Log in with your admin credentials or create a new user
2. **Create Post**: Click the "+" button to create a new post
3. **Add Content**: Write your thoughts, add images, and select categories
4. **Anime Integration**: Type an anime name to automatically fetch data from MyAnimeList
5. **Publish**: Save your post and share your thoughts!

### Exploring Anime Data

```bash
# Get current season anime
curl "http://localhost:5000/api/anime/season/2024/fall?limit=10"

# Search for specific anime
curl "http://localhost:5000/api/anime/search?q=attack+on+titan"

# Get detailed anime information
curl "http://localhost:5000/api/anime/details/16498"

# Get top-rated anime
curl "http://localhost:5000/api/anime/ranking?ranking_type=all&limit=10"
```

### Using the CLI Tools

```bash
cd aninotion-backend

# Create database backup
npm run backup

# Run health checks
npm run health

# Database migrations
npm run migrate

# View all CLI options
npm run cli --help
```

## 📱 Screenshots

<!-- Add screenshots here when available -->
*Screenshots coming soon! The application features a clean, modern interface with:*
- **Dashboard**: Overview of recent posts and anime data
- **Post Creation**: Rich editor with anime integration
- **Anime Explorer**: Browse and discover anime with beautiful cards
- **User Management**: Admin panel for user roles and permissions

## 🗂 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new user (Admin only)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Posts Endpoints
- `GET /api/posts` - Get all posts (with pagination)
- `POST /api/posts` - Create new post (Auth required)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post (Auth required)
- `DELETE /api/posts/:id` - Delete post (Auth required)

### Anime Endpoints
- `GET /api/anime/search` - Search anime by title
- `GET /api/anime/details/:id` - Get detailed anime info
- `GET /api/anime/ranking` - Get ranked anime lists
- `GET /api/anime/season/:year/:season` - Get seasonal anime

### User Management
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Admin/Self)
- `DELETE /api/users/:id` - Delete user (Admin only)

For complete API documentation, see [API Documentation](aninotion-backend/docs/API_V0.5.md).

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | ✅ | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | ✅ | - |
| `MYANIME_LIST_CLIENT_ID` | MyAnimeList API client ID | ✅ | - |
| `PORT` | Server port | ❌ | 5000 |
| `NODE_ENV` | Environment mode | ❌ | development |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ❌ | - |
| `LOG_LEVEL` | Logging level | ❌ | info |

### Feature Flags

Enable/disable features through environment variables:
- `ENABLE_BACKUP_SCHEDULER=true` - Automatic backups
- `ENABLE_EMAIL_NOTIFICATIONS=true` - Email notifications
- `ENABLE_REDIS_CACHING=true` - Redis caching

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Quick Start for Contributors

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/yourusername/AniNotion.git`
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and ensure tests pass
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation for API changes
- Ensure all linting and tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MyAnimeList** for providing comprehensive anime data through their API
- **The React Team** for the amazing React framework
- **Tailwind CSS** for the beautiful utility-first CSS framework
- **MongoDB** for the flexible NoSQL database solution
- **All Contributors** who help make AniNotion better

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/AniNotion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/AniNotion/discussions)
- **Documentation**: [Project Wiki](https://github.com/yourusername/AniNotion/wiki)

## 🗺 Roadmap

- [ ] **Mobile App**: React Native mobile application
- [ ] **Social Features**: User following and social interactions
- [ ] **Advanced Analytics**: Personal viewing statistics and insights
- [ ] **Recommendation Engine**: AI-powered anime recommendations
- [ ] **Export Features**: PDF and other format exports
- [ ] **Integrations**: Integration with other anime platforms
- [ ] **Real-time Features**: Live updates and notifications

---

<div align="center">

**Made with ❤️ for the anime community**

[⭐ Star this project](https://github.com/yourusername/AniNotion) • [🐛 Report Bug](https://github.com/yourusername/AniNotion/issues) • [💡 Request Feature](https://github.com/yourusername/AniNotion/issues)

</div>