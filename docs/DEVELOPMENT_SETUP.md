# Development Environment Setup

This guide will help you set up your development environment for the Lumiku project with all the necessary tools and configurations.

## Quick Start

After cloning the repository, run:

```bash
# Install dependencies (includes setting up git hooks)
bun install

# Start development servers
bun run dev
```

## Development Tools

### Installed Tools

The following tools are configured and ready to use:

1. **TypeScript** - Type checking with strict mode enabled
2. **ESLint** - Code linting with comprehensive rules
3. **Prettier** - Code formatting for consistency
4. **Husky** - Git hooks for automated checks

### Available Scripts

#### Root Level Commands

```bash
# Development
bun run dev              # Start both frontend and backend
bun run dev:frontend     # Start frontend only
bun run dev:backend      # Start backend only

# Building
bun run build            # Build both frontend and backend
bun run build:frontend   # Build frontend only
bun run build:backend    # Build backend only

# Code Quality
bun run lint             # Run ESLint on all files
bun run lint:fix         # Auto-fix ESLint issues
bun run format           # Format all files with Prettier
bun run format:check     # Check if files are formatted
bun run type-check       # Run TypeScript type checking

# Database
bun run prisma:generate  # Generate Prisma client
bun run prisma:migrate   # Run database migrations
bun run prisma:studio    # Open Prisma Studio

# Testing
bun run test             # Run tests

# Maintenance
bun run clean            # Remove node_modules
```

#### Backend Commands

```bash
cd backend

bun run dev              # Start dev server with watch mode
bun run start            # Start production server
bun run build            # Build for production
bun run lint             # Lint backend code
bun run format           # Format backend code
bun run type-check       # Type check backend
```

#### Frontend Commands

```bash
cd frontend

bun run dev              # Start Vite dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Lint frontend code
bun run format           # Format frontend code
bun run type-check       # Type check frontend
```

## Git Hooks

Husky is configured to run automatic checks at various stages of your git workflow:

### Pre-commit Hook

Runs before each commit:

1. **Type checking** - Ensures no TypeScript errors
2. **Linting** - Checks code quality
3. **Formatting** - Ensures consistent code style

If any check fails, the commit is blocked. Fix the issues before committing.

### Commit Message Hook

Validates commit message format. Messages must follow conventional commits:

```
type(scope): subject

Examples:
feat(auth): add password reset functionality
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
```

**Valid types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test additions/changes
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Maintenance tasks

### Pre-push Hook

Runs before pushing to remote:

1. **Tests** - Ensures all tests pass
2. **TODO/FIXME check** - Warns if you're pushing unresolved TODOs

## Code Quality Workflow

### Before Committing

```bash
# 1. Format your code
bun run format

# 2. Fix linting issues
bun run lint:fix

# 3. Check types
bun run type-check

# 4. Run tests
bun run test
```

### During Development

Your editor should be configured to:

1. Show TypeScript errors inline
2. Run ESLint and show warnings
3. Format on save with Prettier

### Editor Configuration

#### VS Code

Install these extensions:

- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features (built-in)

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## TypeScript Configuration

We use strict TypeScript configuration with:

- **Strict null checks** - Prevents null/undefined errors
- **No implicit any** - Requires explicit types
- **Strict function types** - Ensures type safety in callbacks
- **No unused variables** - Keeps code clean
- **No implicit returns** - Requires explicit return statements
- **No unchecked indexed access** - Safer array/object access

See `backend/tsconfig.json` and `frontend/tsconfig.json` for full configuration.

## ESLint Configuration

Our ESLint rules enforce:

- **Import organization** - Sorted and grouped imports
- **Naming conventions** - Consistent naming patterns
- **React best practices** - Hooks rules, prop types
- **Security rules** - No eval, no script URLs
- **Code quality** - No console in frontend, proper error handling

See `.eslintrc.js` for full configuration.

## Prettier Configuration

Code formatting is standardized with:

- 2 spaces indentation
- Single quotes for strings
- Semicolons always
- 100 character line length
- Trailing commas (ES5 style)

See `.prettierrc` for full configuration.

## Troubleshooting

### Git hooks not running

```bash
# Reinstall Husky
bun run prepare

# Make hooks executable (Unix/Mac)
chmod +x .husky/pre-commit .husky/pre-push .husky/commit-msg
```

### TypeScript errors after pull

```bash
# Regenerate Prisma client
bun run prisma:generate

# Reinstall dependencies
bun install
```

### Linting errors

```bash
# Try auto-fixing
bun run lint:fix

# If that doesn't work, fix manually based on error messages
```

### Formatting issues

```bash
# Format all files
bun run format

# Check what needs formatting
bun run format:check
```

### Type check failing

```bash
# Check backend
cd backend && bun run type-check

# Check frontend
cd frontend && bun run type-check

# Fix errors based on output
```

## Best Practices

1. **Commit frequently** - Small, focused commits are better
2. **Write clear commit messages** - Follow conventional commits
3. **Run checks before pushing** - Don't push broken code
4. **Keep dependencies updated** - Regular updates prevent issues
5. **Document your changes** - Update docs when needed
6. **Review your own code** - Check diffs before committing
7. **Ask for help** - If stuck, ask the team

## Next Steps

- Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed coding guidelines
- Check [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for development workflow
- Review the codebase structure in project README

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Bun Documentation](https://bun.sh/docs)
