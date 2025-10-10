# 🤝 Contributing to AniNotion

Thank you for your interest in contributing to AniNotion! This guide will help you get started with contributing to our anime and media tracking application.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful, inclusive, and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB** 4.4 or higher (local or Atlas)
- **Git** for version control

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/aninotion-app.git
   cd aninotion-app
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/aninotion-app.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd aninotion-frontend && npm install && cd ..

# Install backend dependencies
cd aninotion-backend && npm install && cd ..
```

### 2. Environment Configuration

#### Backend Environment

Create `aninotion-backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aninotion_dev
MONGODB_TEST_URI=mongodb://localhost:27017/aninotion_test

# Authentication
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Google OAuth (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
NODE_ENV=development

# Email (Optional - for notifications)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@aninotion.com

# Server Configuration
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Environment

Create `aninotion-frontend/.env`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=AniNotion

# Google OAuth (must match backend)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Development
VITE_NODE_ENV=development
```

### 3. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# Seed the database with initial data
npm run seed

# Run migrations to set up the latest schema
npm run migrate:v0.5
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run server  # Backend only (http://localhost:5000)
npm run client  # Frontend only (http://localhost:5173)
```

### 5. Verify Setup

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
aninotion-app/
├── 📁 aninotion-frontend/          # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable UI components
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   ├── PostForm.jsx        # Post creation form
│   │   │   ├── PostCard.jsx        # Post display card
│   │   │   └── ...
│   │   ├── 📁 pages/              # Route components
│   │   │   ├── Home.jsx           # Homepage with post list
│   │   │   ├── PostPage.jsx       # Individual post view
│   │   │   └── ...
│   │   ├── 📁 context/            # React Context providers
│   │   │   ├── AuthContext.jsx    # Authentication state
│   │   │   └── LayoutContext.jsx  # UI layout state
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 services/           # API service layer
│   │   │   └── api.js             # Axios API client
│   │   └── 📁 assets/             # Static assets
│   └── 📁 docs/                   # Frontend documentation
├── 📁 aninotion-backend/           # Node.js backend
│   ├── 📁 config/                 # Configuration files
│   │   ├── database.js            # MongoDB connection
│   │   ├── passport.js            # Authentication config
│   │   └── logger.js              # Logging configuration
│   ├── 📁 models/                 # Mongoose models
│   │   ├── User.js                # User model with auth
│   │   ├── Post.js                # Post model with lifecycle
│   │   └── Category.js            # Category model
│   ├── 📁 routes/                 # Express route handlers
│   │   ├── auth.js                # Authentication routes
│   │   ├── posts.js               # Post CRUD operations
│   │   ├── categories.js          # Category management
│   │   └── ...
│   ├── 📁 middleware/             # Express middleware
│   │   ├── auth.js                # JWT authentication
│   │   ├── roleAuth.js            # Role-based authorization
│   │   └── logging.js             # Request logging
│   ├── 📁 utils/                  # Utility functions
│   │   ├── backup.js              # Database backup system
│   │   ├── migration.js           # Database migrations
│   │   └── helpers.js             # General utilities
│   └── 📁 scripts/                # CLI and maintenance scripts
└── 📁 .github/                    # GitHub templates
    ├── 📁 ISSUE_TEMPLATE/         # Issue templates
    └── 📁 PULL_REQUEST_TEMPLATE/  # PR templates
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the [Code Style Guidelines](#code-style-guidelines)
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation if needed

### 3. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add anime search functionality"
```

#### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 4. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## 🎨 Code Style Guidelines

### JavaScript/React

- **ES6+** syntax preferred
- **Functional components** with hooks
- **Destructuring** for props and state
- **Arrow functions** for inline functions
- **Async/await** over promises when possible

#### Example Component:

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onLike }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Component logic here
  }, [post.id]);

  const handleLike = async () => {
    try {
      await onLike(post.id);
      setIsLiked(true);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  return (
    <div className="post-card">
      <h3>{post.title}</h3>
      <button onClick={handleLike}>
        {isLiked ? '❤️' : '🤍'} {post.likesCount}
      </button>
    </div>
  );
};

export default PostCard;
```

### Node.js/Express

- **Async/await** for asynchronous operations
- **Error handling** with try/catch blocks
- **Middleware** for cross-cutting concerns
- **Validation** for all inputs
- **Logging** for debugging and monitoring

#### Example Route Handler:

```javascript
const createPost = async (req, res) => {
  try {
    const { title, content, category, animeName } = req.body;

    // Validation
    if (!title || !content || !category || !animeName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Title, content, category, and anime name are required',
      });
    }

    // Create post
    const post = new Post({
      title,
      content,
      category,
      animeName,
      createdBy: req.user.id,
    });

    await post.save();
    await post.populate('category createdBy');

    logger.info('Post created successfully', {
      postId: post._id,
      userId: req.user.id,
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create post',
    });
  }
};
```

### CSS/Styling

- **TailwindCSS** utility classes preferred
- **Responsive design** with mobile-first approach
- **Consistent spacing** using Tailwind's spacing scale
- **Semantic class names** for custom components

```jsx
// Good: Responsive, semantic, consistent
<div className="post-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 hover:shadow-lg transition-shadow">
  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
    {post.title}
  </h3>
</div>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
cd aninotion-frontend && npm test

# Run backend tests
cd aninotion-backend && npm test

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

#### Frontend Tests (Jest + React Testing Library)

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from '../components/PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: '1',
    title: 'Test Post',
    likesCount: 5,
  };

  it('renders post title', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('handles like button click', () => {
    const onLike = jest.fn();
    render(<PostCard post={mockPost} onLike={onLike} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onLike).toHaveBeenCalledWith('1');
  });
});
```

#### Backend Tests (Jest + Supertest)

```javascript
const request = require('supertest');
const app = require('../server');

describe('POST /api/posts', () => {
  it('creates a new post', async () => {
    const postData = {
      title: 'Test Post',
      content: 'Test content',
      category: 'categoryId',
      animeName: 'Test Anime',
    };

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(postData)
      .expect(201);

    expect(response.body.post.title).toBe('Test Post');
  });
});
```

## 📝 Submitting Changes

### Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with main branch
- [ ] PR description explains the changes

### Pull Request Template

When creating a PR, use the appropriate template:

- **Feature**: Use `feature.md` template
- **Bug Fix**: Use `bugfix.md` template
- **Documentation**: Use `docs.md` template
- **Refactoring**: Use `refactor.md` template
- **Maintenance**: Use `chore.md` template

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for solutions
3. **Try the latest version** to see if it's already fixed

### Issue Types

Use the appropriate issue template:

- **🐛 Bug Report** - For reporting bugs
- **✨ Feature Request** - For suggesting new features
- **📚 Documentation** - For documentation improvements
- **🔧 Maintenance** - For technical debt and maintenance

### Writing Good Issues

- **Clear title** that summarizes the issue
- **Detailed description** with steps to reproduce
- **Environment information** (OS, browser, versions)
- **Screenshots or logs** when applicable
- **Expected vs actual behavior**

## 🔍 Pull Request Process

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Code review** by at least one maintainer
3. **Manual testing** for UI/UX changes
4. **Documentation review** for API changes
5. **Final approval** and merge

### Review Criteria

- **Functionality** - Does it work as intended?
- **Code Quality** - Is it readable and maintainable?
- **Performance** - Does it impact performance?
- **Security** - Are there any security concerns?
- **Testing** - Is it adequately tested?
- **Documentation** - Is documentation updated?

## 🏷️ Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Workflow

1. **Feature freeze** for the release
2. **Testing** and bug fixes
3. **Documentation** updates
4. **Version bump** and changelog
5. **Release** and deployment

## 🆘 Getting Help

### Community Support

- **GitHub Discussions** - For questions and community help
- **Discord Server** - Real-time chat with contributors
- **Stack Overflow** - Tag questions with `aninotion`

### Maintainer Contact

- **Email** - maintainers@aninotion.com
- **GitHub** - Mention `@aninotion/maintainers`

## 🎉 Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub** - Contributor graphs and statistics
- **Discord** - Special contributor role

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Jest Testing Framework](https://jestjs.io/docs)

---

Thank you for contributing to AniNotion! Your efforts help make this project better for everyone. 🙏
