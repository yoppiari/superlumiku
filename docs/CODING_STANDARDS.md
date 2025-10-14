# Lumiku Coding Standards

This document outlines the coding standards, best practices, and conventions for the Lumiku project. Following these guidelines ensures code consistency, maintainability, and quality across the entire codebase.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [Code Style](#code-style)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [React Best Practices](#react-best-practices)
- [API Design](#api-design)
- [Error Handling](#error-handling)
- [Security](#security)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Documentation](#documentation)

## General Principles

### 1. Code Quality

- **Write self-documenting code**: Use clear variable and function names that explain intent
- **Keep it simple**: Avoid over-engineering; prefer simple, readable solutions
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions
- **SOLID principles**: Follow SOLID design principles for maintainable code
- **Performance matters**: Write efficient code, but prioritize readability first

### 2. Code Reviews

- All code must be reviewed before merging
- Review for correctness, readability, and adherence to standards
- Provide constructive feedback
- Be respectful and professional

### 3. Dependencies

- Minimize external dependencies
- Keep dependencies up to date
- Audit dependencies for security vulnerabilities
- Document why each dependency is needed

## TypeScript Standards

### Strict Type Checking

We use strict TypeScript configuration. All code must:

- **Avoid `any`**: Use proper types or `unknown` when type is truly unknown
- **Handle null/undefined**: Use strict null checks and optional chaining
- **Use type inference**: Let TypeScript infer types when obvious
- **Define explicit return types**: For public APIs and complex functions
- **Use type guards**: For runtime type checking

**Good:**
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
}

function getUserById(id: string): Promise<User | null> {
  // Implementation
}

// Type guard
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}
```

**Bad:**
```typescript
function getUserById(id: any): any {
  // Bad: uses any type
}

function processData(data) {
  // Bad: missing types
}
```

### Type Organization

- Keep types close to where they're used
- Use `types/` directory for shared types
- Export types alongside implementations
- Use `type` for type aliases, `interface` for object shapes

```typescript
// Good
export type UserId = string;

export interface User {
  id: UserId;
  email: string;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}
```

## Code Style

We use Prettier and ESLint to enforce code style. Key conventions:

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings, double for JSX
- **Semicolons**: Always use semicolons
- **Line length**: 100 characters max
- **Trailing commas**: Use ES5 style (objects, arrays)

### Code Organization

```typescript
// 1. Imports (grouped and sorted)
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';

import type { User } from '@/types';

// 2. Types and interfaces
interface ComponentProps {
  user: User;
  onUpdate: (user: User) => void;
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Component/function definition
export function UserProfile({ user, onUpdate }: ComponentProps) {
  // Implementation
}
```

### Comments

- Use comments to explain **why**, not **what**
- Document complex algorithms and business logic
- Use JSDoc for public APIs
- Keep comments up to date

```typescript
// Good - explains why
// We cache results for 5 minutes to reduce API calls during high traffic
const CACHE_DURATION = 5 * 60 * 1000;

// Bad - explains what (obvious from code)
// Set cache duration to 300000 milliseconds
const CACHE_DURATION = 300000;
```

## File Organization

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point

frontend/
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components
│   │   └── features/   # Feature-specific components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── stores/         # State management
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── App.tsx         # Root component
```

### File Naming

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`User.ts`, `types.ts`)
- **Tests**: Same as file with `.test.ts` suffix
- **Constants**: UPPER_SNAKE_CASE for file if all exports are constants

## Naming Conventions

### Variables and Functions

```typescript
// Variables: camelCase
const userName = 'John';
const isActive = true;
const userList = [];

// Functions: camelCase, verb-based
function getUserById(id: string) {}
function validateEmail(email: string) {}
function handleSubmit(event: Event) {}

// Boolean variables: use is/has/can prefix
const isLoading = false;
const hasPermission = true;
const canEdit = true;

// Event handlers: use handle prefix
const handleClick = () => {};
const handleChange = (e: Event) => {};
```

### Classes and Types

```typescript
// Classes: PascalCase
class UserService {}
class ApiClient {}

// Interfaces: PascalCase, no "I" prefix
interface User {}
interface ApiResponse {}

// Type aliases: PascalCase
type UserId = string;
type AsyncResult<T> = Promise<T | null>;

// Enums: PascalCase for name, UPPER_CASE for members
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

### Constants

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 30000;
```

## React Best Practices

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';

// 2. Types
interface UserCardProps {
  userId: string;
  onSelect?: (userId: string) => void;
}

// 3. Component
export function UserCard({ userId, onSelect }: UserCardProps) {
  // 4. Hooks (in order: state, effects, custom hooks)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch user
  }, [userId]);

  // 5. Event handlers
  const handleClick = () => {
    onSelect?.(userId);
  };

  // 6. Render logic
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  );
}
```

### Hooks

- **Custom hooks**: Use `use` prefix (`useAuth`, `useApi`)
- **Extract logic**: Move complex logic to custom hooks
- **Dependencies**: Always specify all dependencies in useEffect
- **Cleanup**: Clean up side effects in useEffect return

```typescript
// Good: Custom hook
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const data = await api.getUser(userId);
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, error, isLoading };
}
```

### State Management

- **Local state**: Use `useState` for component-specific state
- **Global state**: Use Zustand for app-wide state
- **Server state**: Use React Query for API data
- **Minimize state**: Derive values when possible

```typescript
// Good: Derive values instead of storing
function ProductList({ products }: Props) {
  const [filter, setFilter] = useState('');

  // Derived value
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return /* ... */;
}

// Bad: Unnecessary state
function ProductList({ products }: Props) {
  const [filter, setFilter] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    setFilteredProducts(
      products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [products, filter]);

  return /* ... */;
}
```

## API Design

### REST Conventions

- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use plural nouns for resources (`/users`, not `/user`)
- Use nested routes for relationships (`/users/:id/posts`)
- Return appropriate status codes

```typescript
// Good API design
GET    /api/users           # List users
GET    /api/users/:id       # Get user
POST   /api/users           # Create user
PUT    /api/users/:id       # Update user (full)
PATCH  /api/users/:id       # Update user (partial)
DELETE /api/users/:id       # Delete user
```

### Request/Response Format

```typescript
// Request body
interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Validation

- Validate all inputs using Zod
- Return clear validation errors
- Sanitize user input

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

// In route handler
const result = createUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: result.error.format(),
    },
  });
}
```

## Error Handling

### Custom Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}
```

### Error Handling Patterns

```typescript
// API routes: Use try-catch
async function getUser(req: Request, res: Response) {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    throw error; // Let error middleware handle
  }
}

// React components: Use error boundaries
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Security

### Authentication

- Use JWT tokens for authentication
- Store tokens securely (httpOnly cookies for web)
- Implement token refresh mechanism
- Hash passwords with bcrypt (10+ rounds)

### Input Validation

- Validate and sanitize all user input
- Use parameterized queries (Prisma protects against SQL injection)
- Implement rate limiting on sensitive endpoints
- Use CSRF protection for state-changing operations

### Secrets Management

- Never commit secrets to git
- Use environment variables for configuration
- Use different secrets for dev/staging/production
- Rotate secrets regularly

```typescript
// Good: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET!;

// Bad: Hardcoded secrets
const JWT_SECRET = 'my-secret-key';
```

## Testing

### Unit Tests

- Test pure functions and business logic
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

```typescript
describe('formatDate', () => {
  it('should format ISO date to readable format', () => {
    // Arrange
    const isoDate = '2024-01-15T10:30:00Z';

    // Act
    const result = formatDate(isoDate);

    // Assert
    expect(result).toBe('January 15, 2024');
  });

  it('should handle invalid dates gracefully', () => {
    expect(() => formatDate('invalid')).toThrow(ValidationError);
  });
});
```

### Integration Tests

- Test API endpoints end-to-end
- Use test database
- Clean up test data after each test
- Test error scenarios

### Test Coverage

- Aim for 80%+ code coverage
- Focus on critical business logic
- Test edge cases and error paths
- Don't test framework code

## Git Workflow

### Commit Messages

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
refactor(db): optimize user query performance
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Pull Requests

- Create focused PRs (one feature/fix per PR)
- Write clear PR descriptions
- Reference related issues
- Ensure CI passes before requesting review
- Address review comments promptly

## Documentation

### Code Documentation

```typescript
/**
 * Calculates the total price including tax and discounts.
 *
 * @param basePrice - The base price before tax and discounts
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code to apply
 * @returns The final price after tax and discounts
 * @throws {ValidationError} If basePrice is negative or taxRate is invalid
 *
 * @example
 * ```typescript
 * const total = calculateTotal(100, 0.08, 'SAVE10');
 * // Returns: 97.20 (100 * 1.08 * 0.9)
 * ```
 */
export function calculateTotal(
  basePrice: number,
  taxRate: number,
  discountCode?: string
): number {
  // Implementation
}
```

### README Files

- Every package should have a README
- Include setup instructions
- Document environment variables
- Provide usage examples

### API Documentation

- Document all public endpoints
- Include request/response examples
- Document error responses
- Keep documentation in sync with code

## Tools and Configuration

### Development Tools

- **TypeScript**: Strict mode enabled
- **ESLint**: For linting and code quality
- **Prettier**: For code formatting
- **Husky**: For git hooks
- **Bun**: Package manager and runtime

### Pre-commit Checks

Our git hooks run these checks automatically:

1. **Type checking**: `bun run type-check`
2. **Linting**: `bun run lint`
3. **Formatting**: `bun run format:check`

Fix issues before committing:

```bash
# Fix formatting
bun run format

# Fix linting issues (some auto-fixable)
bun run lint --fix

# Check types
bun run type-check
```

## Continuous Improvement

These standards are living documents. If you find:

- Better ways to solve problems
- Gaps in the standards
- Outdated practices

Please propose changes through a pull request.

---

**Remember**: The goal is to write code that is:
- **Correct**: Works as intended
- **Clear**: Easy to understand
- **Consistent**: Follows established patterns
- **Maintainable**: Easy to modify and extend
- **Secure**: Protects user data and system integrity
