# AniNotion

A modern journal application for logging and tracking things you watch and read, with a focus on anime content. Built with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
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
```

### 3. Environment Setup

Create environment files for both backend and frontend:

#### Backend Environment (`.env` in `aninotion-backend/`)

```bash
cd aninotion-backend
```

**Required Environment Variables:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aninotion

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRY=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug
```

#### Frontend Environment (`.env` in `aninotion-frontend/`)

```bash
cd aninotion-frontend
```

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Update `MONGODB_URI` in your `.env` file

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

### 5. Seed Initial Data

```bash
cd aninotion-backend

# Seed default categories
npm run seed:categories

# Create admin user
npm run seed:admin
```

**Default Admin Credentials:**
- Email: `admin@aninotion.com`
- Password: `admin123456`

⚠️ **Important**: Change the admin password after first login!

### 6. Start the Application

#### Development Mode (Recommended)

From the root directory:

```bash
# Start both backend and frontend concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

#### Manual Start

```bash
# Terminal 1 - Backend
cd aninotion-backend
npm run dev

# Terminal 2 - Frontend
cd aninotion-frontend
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🛠️ Available Scripts

### Root Level
```bash
npm run dev          # Start both backend and frontend
npm run server       # Start only backend
npm run client       # Start only frontend
```

### Backend Scripts
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run seed:admin   # Create admin user
npm run seed:categories # Seed default categories
npm run backup       # Create database backup
npm run migrate      # Run database migrations
npm run health       # Check system health
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Required Services

1. **MongoDB**: Database for storing posts, users, and categories
2. **Cloudinary**: Image storage and processing (free tier available)

### Optional Services

1. **MyAnimeList API**: For anime data integration
2. **Redis**: For enhanced logging (Upstash free tier available)
3. **Resend**: For email notifications

### Environment Variables Reference

See `aninotion-backend/config/environment.js` for complete configuration options.

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Set build command: `cd aninotion-frontend && npm run build`
3. Set output directory: `aninotion-frontend/dist`
4. Add environment variable: `VITE_API_BASE_URL=your-backend-url`

### Backend (Railway/Render/Heroku)

1. Set up your deployment platform
2. Add all required environment variables
3. Set start command: `cd aninotion-backend && npm start`
4. Ensure MongoDB connection is accessible

## 📚 Documentation

- [API Documentation](aninotion-backend/docs/API_V0.5.md)
- [Anime API Integration](aninotion-backend/docs/ANIME_API.md)
- [Backup System Guide](aninotion-backend/docs/AUTOMATIC_VS_MANUAL_BACKUPS.md)
- [Setup Documentation](aninotion-backend/docs/PHASE_0_SETUP.md)

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify `MONGODB_URI` in `.env` file
   - Ensure MongoDB is accessible from your network

2. **Port Already in Use**
   - Backend: Change `PORT` in `.env` file
   - Frontend: Change port in `vite.config.js`

3. **Image Upload Not Working**
   - Verify Cloudinary credentials in `.env`
   - Check Cloudinary dashboard for usage limits

4. **Authentication Issues**
   - Ensure `JWT_SECRET` is set and at least 32 characters
   - Check if admin user exists: `npm run seed:admin`

### Getting Help

1. Check the logs in the terminal
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the documentation in the `docs/` folder

## 🎯 Features

- ✅ User authentication and role-based access
- ✅ Create, edit, and manage posts
- ✅ Image upload and processing
- ✅ Category-based organization
- ✅ Anime integration with MyAnimeList API
- ✅ Responsive design with mobile support
- ✅ Automated backup system
- ✅ Comprehensive logging
- ✅ SEO-friendly URLs
- ✅ Draft/publish workflow

## 🏗️ Architecture

### Backend
- **Framework**: Express.js with Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Logging**: Pino logger with Redis transport
- **File Storage**: Cloudinary for image processing
- **External APIs**: MyAnimeList API integration
- **Backup System**: Automated backup scheduling with cloud storage

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **State Management**: React Context API

## 📊 Data Models

### User Model
- Email-based authentication with role-based access (admin, editor, viewer)
- Password hashing with configurable bcrypt rounds
- User status management (active, disabled, deleted)
- Audit trail with created/updated/deleted tracking

### Post Model
- Rich content management with title, anime name, category, and content
- SEO-friendly slugs and status lifecycle (draft, published, scheduled)
- Engagement metrics (views, likes, reading time)
- Image support with multiple image handling
- Tag system and excerpt generation
- Soft delete functionality

### Category Model
- Simple categorization system with unique names and slugs
- Default category support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MyAnimeList](https://myanimelist.net/) for anime data API
- [Cloudinary](https://cloudinary.com/) for image processing
- [MongoDB](https://www.mongodb.com/) for database
- [React](https://reactjs.org/) and [Node.js](https://nodejs.org/) communities