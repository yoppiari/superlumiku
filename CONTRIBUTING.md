# Contributing to Lumiku

Thank you for contributing to Lumiku! This guide will help you understand our development standards and processes.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Standards](#development-standards)
- [Code Review Process](#code-review-process)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd lumiku-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

---

## Development Standards

### Project Structure
```
lumiku-app/
├── frontend/
│   ├── src/
│   │   ├── apps/              # Application modules
│   │   ├── components/        # Shared components
│   │   ├── stores/            # Zustand state management
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── public/
├── backend/
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Backend utilities
│   └── prisma/
└── docs/                      # Documentation
```

### Code Style

#### TypeScript
- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` types - use `unknown` or proper types
- Use proper null checking (`user?.name` or `user ?? 'default'`)

```tsx
// Good
interface User {
  id: string
  name: string
  email: string
}

const getUser = (id: string): User | null => {
  // ...
}

// Bad
const getUser = (id: any): any => {
  // ...
}
```

#### React Components
- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components focused and single-responsibility

```tsx
// Good
export default function UserProfile() {
  const { user, loading } = useUser()

  if (loading) return <LoadingSpinner />
  if (!user) return <NotFound />

  return <ProfileContent user={user} />
}

// Bad
export default function UserProfile() {
  // 500 lines of mixed logic and JSX
}
```

#### Naming Conventions
- Components: PascalCase (`UserProfile`, `CreateProjectModal`)
- Files: Match component name (`UserProfile.tsx`)
- Functions: camelCase (`handleSubmit`, `fetchUserData`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- CSS Classes: kebab-case or Tailwind utilities

---

## UnifiedHeader Standards

**CRITICAL: All new apps MUST use UnifiedHeader component.**

### Required Implementation

Every app must include UnifiedHeader at the top level:

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { YourIcon } from 'lucide-react'

export default function YourApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="Your App Name"
        subtitle="Brief description (optional)"
        icon={<YourIcon className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="your-app-id"
        actions={null}
      />

      {/* Your app content */}
    </div>
  )
}
```

### Header Standards Checklist

Before submitting a PR with a new app, verify:

- [ ] UnifiedHeader is imported and used
- [ ] All required props are provided (title, icon, currentAppId)
- [ ] Icon size is exactly `w-5 h-5`
- [ ] Icon color follows [color scheme standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards)
- [ ] `currentAppId` matches app ID in AVAILABLE_APPS array
- [ ] `backPath` is correct (dashboard for main view, app list for detail view)
- [ ] No custom headers or navigation components are created
- [ ] Header works on mobile, tablet, and desktop

### Color Scheme Standards

Use these standardized colors:

| App Type | Color Classes |
|----------|--------------|
| Avatar/Character | `bg-purple-50 text-purple-700` |
| AI Generation | `bg-indigo-50 text-indigo-700` |
| Video/Media | `bg-blue-50 text-blue-700` |
| Editing | `bg-green-50 text-green-700` |
| Background/Utility | `bg-orange-50 text-orange-700` |
| Analytics | `bg-slate-50 text-slate-700` |

**Reference Documentation:**
- [Complete Header Standards](./HEADER_DEVELOPMENT_STANDARDS.md)
- [New App Template](./NEW_APP_TEMPLATE.md)

---

## Code Review Process

### Before Requesting Review

1. **Self-Review**
   - [ ] Code follows style guidelines
   - [ ] No console.log statements (use proper logging)
   - [ ] No commented-out code
   - [ ] All TypeScript errors resolved
   - [ ] Proper error handling implemented

2. **Testing**
   - [ ] All features tested manually
   - [ ] Edge cases considered
   - [ ] Mobile responsiveness verified
   - [ ] Cross-browser compatibility checked (Chrome, Firefox, Safari)

3. **Documentation**
   - [ ] Code comments for complex logic
   - [ ] README updated if needed
   - [ ] API documentation updated (if backend changes)

### Review Checklist for Headers

When reviewing PRs that include app development:

- [ ] **UnifiedHeader is used** - No custom headers
- [ ] **All required props provided** - title, icon, currentAppId
- [ ] **Icon sizing correct** - Exactly `w-5 h-5`
- [ ] **Color scheme appropriate** - Follows standards for app type
- [ ] **Navigation correct** - Back button goes to right place
- [ ] **App switcher works** - Current app highlighted
- [ ] **Responsive design** - Works on all screen sizes
- [ ] **No anti-patterns** - No nested headers, no style overrides

### Quality Gates

All PRs must pass:
1. TypeScript compilation
2. ESLint checks
3. Prettier formatting
4. Build process
5. Automated tests (if applicable)

---

## Pull Request Guidelines

### PR Title Format
```
type(scope): brief description

Examples:
feat(avatar-creator): add bulk upload feature
fix(pose-generator): resolve generation error
docs(header): update implementation guide
refactor(video-mixer): improve state management
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## UnifiedHeader Checklist (if applicable)
- [ ] UnifiedHeader properly implemented
- [ ] All required props provided
- [ ] Icon size is w-5 h-5
- [ ] Color scheme follows standards
- [ ] Navigation paths correct
- [ ] Tested on mobile/tablet/desktop

## Testing
- [ ] Tested locally
- [ ] Tested on staging
- [ ] Edge cases covered
- [ ] Mobile responsive

## Screenshots (if UI changes)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process
1. Submit PR with complete description
2. Automated checks run
3. Request review from 1-2 team members
4. Address feedback
5. Get approval
6. Merge to main

---

## Testing Requirements

### Manual Testing Checklist

For any UI changes:
- [ ] Desktop (1920px+)
- [ ] Tablet (768px - 1024px)
- [ ] Mobile (375px - 767px)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] All interactive elements have labels

### Functional Testing
- [ ] All user flows work end-to-end
- [ ] Error states handled gracefully
- [ ] Loading states display correctly
- [ ] Success/failure feedback shown

### Performance Testing
- [ ] Page loads in < 3 seconds
- [ ] Images optimized
- [ ] No memory leaks
- [ ] Smooth animations (60fps)

---

## Documentation

### When to Update Docs

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying user flows
- Adding new components
- Changing configuration

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup |
| `CONTRIBUTING.md` | This file - contribution guidelines |
| `HEADER_DEVELOPMENT_STANDARDS.md` | UnifiedHeader standards |
| `NEW_APP_TEMPLATE.md` | Template for new apps |
| `docs/API.md` | API documentation |
| `docs/ARCHITECTURE.md` | System architecture |

### Code Documentation

```tsx
/**
 * Generates a unique combination of videos for anti-fingerprinting
 *
 * @param videos - Array of video files to combine
 * @param settings - Configuration for mixing algorithm
 * @returns Promise resolving to generated video path
 * @throws {InsufficientCreditsError} When user has insufficient credits
 */
async function generateMix(videos: Video[], settings: MixSettings): Promise<string> {
  // Implementation
}
```

---

## Common Issues and Solutions

### Issue: TypeScript Errors
**Solution**: Run `npm run type-check` and fix all errors before committing.

### Issue: Build Failing
**Solution**: Clear cache with `npm run clean && npm install` and try again.

### Issue: Styling Conflicts
**Solution**: Use Tailwind classes. Avoid custom CSS unless absolutely necessary.

### Issue: State Management
**Solution**: Use Zustand for global state, useState for local state. Keep it simple.

---

## Getting Help

### Resources
- [Header Development Standards](./HEADER_DEVELOPMENT_STANDARDS.md)
- [New App Template](./NEW_APP_TEMPLATE.md)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Lucide Icons](https://lucide.dev)

### Contact
- **Frontend Issues**: #frontend-dev Slack channel
- **Backend Issues**: #backend-dev Slack channel
- **Design Questions**: #design Slack channel
- **Urgent Issues**: @tech-leads

---

## Code of Conduct

### Our Standards
- Be respectful and professional
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

### Enforcement
Violations will be reviewed by project maintainers and may result in:
1. Warning
2. Temporary ban
3. Permanent ban

---

## License

By contributing to Lumiku, you agree that your contributions will be licensed under the same license as the project.

---

**Questions?** Open an issue or ask in #dev-help Slack channel.

**Last Updated**: 2025-01-17
**Maintained By**: Lumiku Development Team
