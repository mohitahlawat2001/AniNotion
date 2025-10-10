<div align="center">

# 🎌 AniNotion

<div id="typewriter">
  <h3>Your Personal Anime & Media Journal</h3>
</div>

_Track, review, and organize everything you watch and read_

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/identity/protocols/oauth2)
[![MyAnimeList](https://img.shields.io/badge/MyAnimeList-2E51A2?style=for-the-badge&logo=myanimelist&logoColor=white)](https://myanimelist.net/)

---

</div>

## ✨ Features

### 📝 **Content Management**

- **Rich Post Creation** - Create detailed reviews and journal entries
- **Category Organization** - Organize content by anime, manga, movies, books, etc.
- **Image Upload** - Upload and manage images with Cloudinary integration
- **Draft & Publish System** - Save drafts and publish when ready
- **Tagging System** - Tag posts for better organization

### 🔍 **Anime Integration**

- **MyAnimeList API** - Search and fetch anime details
- **Seasonal Anime** - Browse current and upcoming seasonal anime
- **Anime Rankings** - Explore top-rated and popular anime
- **Detailed Information** - Get comprehensive anime metadata

### 👤 **User Management**

- **Google OAuth Authentication** - Secure login with Google
- **Role-based Access Control** - Admin, Editor, and User roles
- **User Profiles** - Manage personal information and preferences

### 🎨 **Modern UI/UX**

- **Responsive Design** - Works perfectly on all devices
- **Dark/Light Theme** - Toggle between themes
- **Smooth Animations** - Enhanced user experience
- **Intuitive Navigation** - Easy-to-use interface

### 🔧 **Developer Features**

- **RESTful API** - Well-structured backend API
- **Comprehensive Logging** - Detailed application logging
- **Automated Backups** - Scheduled database backups
- **Health Monitoring** - System health endpoints
- **Code Quality** - ESLint, Prettier, and Husky hooks

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16+), **MongoDB**, **Google OAuth**, **Cloudinary Account**

### Installation

```bash
git clone https://github.com/yourusername/aninotion.git
cd aninotion
npm install
npm run dev
```

**For detailed setup instructions, API keys, and environment configuration, see [CONTRIBUTING.md](CONTRIBUTING.md)**

## 🏗️ Project Structure

```
aninotion/
├── 📁 aninotion-backend/          # Express.js API Server
│   ├── 📁 config/                 # Database & Auth configuration
│   ├── 📁 middleware/             # Custom middleware
│   ├── 📁 models/                 # MongoDB schemas
│   ├── 📁 routes/                 # API endpoints
│   ├── 📁 utils/                  # Helper utilities
│   └── 📄 server.js               # Main server file
├── 📁 aninotion-frontend/         # React.js Client
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable components
│   │   ├── 📁 pages/              # Page components
│   │   ├── 📁 context/            # React contexts
│   │   ├── 📁 hooks/              # Custom hooks
│   │   └── 📁 services/           # API services
│   └── 📄 vite.config.js          # Vite configuration
└── 📄 package.json                # Root package configuration
```

## 🔧 Configuration

The application requires several environment variables for full functionality:

- **Database**: MongoDB connection
- **Authentication**: Google OAuth credentials
- **Storage**: Cloudinary for image uploads
- **API**: MyAnimeList integration (optional)

**Complete configuration guide available in [CONTRIBUTING.md](CONTRIBUTING.md#-environment-configuration)**

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Posts Endpoints

- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like a post

### Categories Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Anime Endpoints

- `GET /api/anime/search` - Search anime
- `GET /api/anime/details/:id` - Get anime details
- `GET /api/anime/ranking` - Get anime rankings
- `GET /api/anime/season/:year/:season` - Get seasonal anime

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start both frontend and backend
npm run lint         # Lint all code
npm run format       # Format code with Prettier
npm run seed         # Seed database with categories
```

**Code Quality**: ESLint, Prettier, Husky git hooks, lint-staged

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Admin, Editor, User roles
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Cross-origin request security
- **Environment Variables** - Secure configuration management

## 📊 Monitoring & Logging

- **Structured Logging** - JSON-based logging with Pino
- **Request Logging** - HTTP request/response logging
- **Error Tracking** - Comprehensive error handling
- **Health Checks** - System health monitoring endpoints

## 🚀 Deployment

Set `NODE_ENV=production`, configure production database, build frontend with `npm run build`, and deploy to your preferred platform.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- **Development setup** with detailed environment configuration
- **Code standards** and best practices
- **Pull request process** and guidelines
- **Getting help** and troubleshooting tips

Quick start: Fork → Create branch → Make changes → Submit PR

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MyAnimeList** - For providing comprehensive anime data
- **Cloudinary** - For reliable image hosting and processing
- **MongoDB** - For flexible document storage
- **React & Vite** - For modern frontend development
- **Express.js** - For robust backend API development

---

<div align="center">

**Made with ❤️ for anime and media enthusiasts**

[⭐ Star this repo](https://github.com/yourusername/aninotion) • [🐛 Report Bug](https://github.com/yourusername/aninotion/issues) • [✨ Request Feature](https://github.com/yourusername/aninotion/issues)

</div>

<style>
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  from, to { border-color: transparent; }
  50% { border-color: #61DAFB; }
}

#typewriter h3 {
  overflow: hidden;
  border-right: 2px solid #61DAFB;
  white-space: nowrap;
  margin: 0 auto;
  letter-spacing: 0.1em;
  animation: 
    typewriter 3s steps(40, end),
    blink 0.75s step-end infinite;
  max-width: fit-content;
}
</style>
