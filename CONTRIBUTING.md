# Contributing to AniNotion

Thanks for your interest in contributing! This guide explains how to set up the project locally, our workflow for proposing changes, and conventions for branches, commits, and pull requests.

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB (local or Atlas)
- MyAnimeList API Client ID (for anime features)

### Local Setup
```bash
# 1) Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/AniNotion.git
cd AniNotion

# 2) Add upstream remote (optional but recommended)
git remote add upstream https://github.com/ADITYATIWARI342005/AniNotion.git

# 3) Install dependencies
npm install
cd aninotion-backend && npm install
cd ../aninotion-frontend && npm install
cd ..

# 4) Configure environment
# Backend: aninotion-backend/.env
# Frontend: aninotion-frontend/.env

# 5) Run development servers (from repo root)
npm run dev
# Backend at http://localhost:5000, Frontend at http://localhost:5173
```

### Environment Variables
See `README.md` for complete lists and examples. Minimum for backend:
- `MONGODB_URI`
- `JWT_SECRET`
- `MYANIME_LIST_CLIENT_ID`

Frontend:
- `VITE_API_BASE_URL=http://localhost:5000/api`

## Git Workflow

### Keep Your Fork Updated
```bash
git checkout main
git fetch upstream
git merge upstream/main
# or: git rebase upstream/main
```

### Branch Naming
Create a feature branch from `main` using one of these prefixes:
- `feat/<short-topic>` – New feature
- `fix/<short-topic>` – Bug fix
- `docs/<short-topic>` – Documentation
- `chore/<short-topic>` – Chores/tooling/configs
- `refactor/<short-topic>` – Refactors
- `perf/<short-topic>` – Performance
- `test/<short-topic>` – Tests only

Examples: `feat/anime-ranking-page`, `fix/post-image-upload`, `docs/update-readme`

### Commit Messages (Conventional Commits)
```
<type>(optional scope): <short summary>

[optional body]
[optional footer(s)]
```
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Examples:
- `feat(post): add rating field to post schema`
- `fix(auth): prevent login for inactive users`
- `docs(readme): add setup instructions`

Reference issues when applicable: `Fixes #12` or `Refs #6`.

## Making Changes

1. Ensure you can run the app locally (`npm run dev`).
2. Keep changes focused, small, and readable.
3. Update docs when APIs, env vars, or scripts change.
4. Backend: keep error handling consistent and logs structured.
5. Frontend: ensure responsive and accessible UI.

### Linting & Formatting
- Frontend: run `npm run lint` in `aninotion-frontend/` and fix issues.
- Match the existing code style; avoid unrelated reformatting.

### Tests
- If adding features, include unit tests where feasible.

## Pull Requests

1. Push your branch to your fork:
```bash
git push -u origin <your-branch>
```
2. Open a PR to `ADITYATIWARI342005/AniNotion` → `main`.
3. PR title: follow conventional commits.
4. PR description checklist:
   - What does this change do?
   - Motivation/Context (link issues: `Fixes #<id>` if applicable)
   - Screenshots/GIFs for UI changes
   - Breaking changes? Migration steps?
   - Docs updated? Env vars added?

### Review Process
- Maintainers review for scope, style, and clarity.
- You may be asked for changes; push updates to the same branch.
- PRs are typically squash-merged.

## Issue Reporting
- Bugs: steps to reproduce, expected/actual, logs, environment.
- Features: use case and proposed solution.
- Docs: point to file/section and suggest wording if possible.

## Code of Conduct
Be respectful and constructive. Harassment and discrimination are not tolerated.

## Security
Do not publicly disclose security issues. File a minimal issue; a maintainer will follow up privately.

## License
By contributing, you agree that your contributions will be licensed under the project’s MIT License. See `LICENSE`.

Thank you for helping make AniNotion better!
