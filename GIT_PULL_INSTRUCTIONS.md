# How to Pull Latest Changes from GitHub

Since git is not available in this WebContainer environment, you'll need to pull changes in your local development environment. Here are the typical steps:

## Standard Git Pull Process

```bash
# 1. Check current status
git status

# 2. Stash any uncommitted changes (if needed)
git stash

# 3. Pull latest changes from the main branch
git pull origin main

# 4. If you had stashed changes, apply them back
git stash pop
```

## Alternative Methods

### If you have conflicts or want to be more careful:

```bash
# 1. Fetch latest changes without merging
git fetch origin

# 2. Check what changes are coming
git log HEAD..origin/main --oneline

# 3. Merge the changes
git merge origin/main
```

### If you want to reset to match remote exactly:

```bash
# WARNING: This will discard local changes
git fetch origin
git reset --hard origin/main
```

## For This Project Specifically

Based on the project structure, you might also want to:

1. **Update dependencies** after pulling:
   ```bash
   npm install
   ```

2. **Run database migrations** if there are new ones:
   ```bash
   npx supabase db reset
   # or
   npx supabase migration up
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Current Project Status

This appears to be an Arabic Hall Booking System with:
- React + TypeScript frontend
- Supabase backend
- Arabic RTL support
- Admin privilege management system

Make sure to check for any new environment variables or configuration changes after pulling updates.