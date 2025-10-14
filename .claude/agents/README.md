# Lumiku Project - Claude Code Agents

Custom and curated agents for Lumiku development workflow.

## 📋 Available Agents

### From [awesome-claude-code-agents](https://github.com/EricTechPro/awesome-claude-code-agents)

#### 1. **Senior Code Reviewer** (`/agents senior-code-reviewer`)
**Best for**: Comprehensive code reviews with security, performance, and best practices
- Deep code analysis
- Security vulnerability detection
- Performance optimization suggestions
- Architecture review
- Type safety improvements

**When to use**:
- After implementing major features
- Before merging to main/production
- When debugging complex issues
- For security audits

**Example**:
```
/agents senior-code-reviewer

Review the Avatar Creator implementation for:
- Security vulnerabilities (file upload, API endpoints)
- Performance issues (N+1 queries, memory leaks)
- Type safety (TypeScript strict mode)
- Code quality and maintainability
```

#### 2. **Code Refactorer** (`/agents code-refactorer`)
**Best for**: Improving code structure, readability, and maintainability
- DRY principle application
- Design pattern suggestions
- Code smell detection
- Performance improvements
- Better naming conventions

**When to use**:
- Large component files (>500 lines)
- Repeated code patterns
- Technical debt cleanup
- Before adding new features to old code

**Example**:
```
/agents code-refactorer

Refactor AvatarCreator.tsx:
- Split into smaller components
- Extract modal components
- Create shared types
- Improve state management
```

#### 3. **Git Commit Helper** (`/agents git-commit-helper`)
**Best for**: Creating professional, semantic commit messages
- Conventional commits format
- Clear, concise descriptions
- Breaking changes documentation
- Co-authored commits

**When to use**:
- Complex feature implementations
- Multiple file changes
- Need detailed commit history
- Team collaboration commits

**Example**:
```
/agents git-commit-helper

Create commit message for:
- Added 3 FLUX AI models
- Fixed dashboard display issue
- Updated seed file
```

#### 4. **System Architect** (`/agents system-architect`)
**Best for**: High-level architecture and system design decisions
- System design patterns
- Scalability planning
- Technology stack decisions
- Integration strategies
- Database design

**When to use**:
- Planning new applications
- Architecture reviews
- Scaling considerations
- Technology migrations

**Example**:
```
/agents system-architect

Design architecture for:
- Real-time avatar generation tracking
- Webhook system for AI completion
- Microservices vs monolith decision
- Caching strategy for dashboard
```

#### 5. **Staff Engineer** (`/agents staff-engineer`)
**Best for**: Technical leadership and strategic decisions
- Technical debt management
- Team best practices
- Code standards
- Mentoring guidance
- Cross-team alignment

**When to use**:
- Establishing project standards
- Technical documentation
- Complex problem solving
- Team process improvements

**Example**:
```
/agents staff-engineer

Establish standards for:
- Plugin development workflow
- Testing strategy
- Error handling patterns
- API versioning approach
```

#### 6. **Premium UX Designer** (`/agents premium-ux-designer`)
**Best for**: UI/UX improvements and design systems
- User experience analysis
- Design system consistency
- Accessibility (a11y)
- Mobile responsiveness
- Visual hierarchy

**When to use**:
- New feature UI design
- Improving existing interfaces
- Accessibility audits
- Design system updates

**Example**:
```
/agents premium-ux-designer

Review Avatar Creator UI:
- Improve preset gallery layout
- Better loading states
- Accessibility for file upload
- Mobile responsive design
```

### Custom Lumiku Agents

#### 7. **Lumiku Plugin Builder** (`/agents lumiku-plugin-builder`)
**Best for**: Creating new Lumiku plugins following project standards
- Plugin scaffolding
- Database schema design
- API endpoint creation
- Frontend integration
- Dashboard registration

**Status**: 🚧 Coming soon

#### 8. **Deployment Specialist** (`/agents deployment-specialist`)
**Best for**: Coolify deployment and production issues
- Docker configuration
- Environment variables
- Database migrations
- Build optimization
- Troubleshooting deployments

**Status**: 🚧 Coming soon

---

## 🚀 Quick Start

### Using an Agent

**Basic syntax**:
```bash
/agents <agent-name>

<your prompt>
```

**With context**:
```bash
/agents senior-code-reviewer

Review backend/src/apps/avatar-creator/services/avatar-creator.service.ts
for security issues, especially file upload handling
```

**Multiple files**:
```bash
/agents code-refactorer

Refactor these files to follow DRY principle:
- frontend/src/apps/AvatarCreator.tsx
- frontend/src/apps/VideoMixer.tsx
- frontend/src/apps/CarouselMix.tsx
```

### Agent Workflow Examples

#### Example 1: New Feature Development
```bash
# 1. Architecture planning
/agents system-architect
Plan architecture for "AI Background Remover" feature

# 2. Implementation (Claude Code regular mode)
[Implement the feature]

# 3. Code review
/agents senior-code-reviewer
Review the AI Background Remover implementation

# 4. Refactoring
/agents code-refactorer
Refactor background-remover.service.ts

# 5. Commit
/agents git-commit-helper
Create commit for AI Background Remover feature
```

#### Example 2: Production Bug Fix
```bash
# 1. Issue analysis
/agents staff-engineer
Avatar generation failing in production but works locally

# 2. Debug (code-reviewer-debugger)
/agents code-reviewer-debugger
Debug avatar generation queue worker

# 3. Fix and commit
/agents git-commit-helper
Create hotfix commit for avatar generation
```

#### Example 3: UI Improvement
```bash
# 1. UX review
/agents premium-ux-designer
Review dashboard layout and suggest improvements

# 2. Implementation
[Implement changes]

# 3. Code review
/agents senior-code-reviewer
Review Dashboard.tsx for accessibility and performance
```

---

## 💡 Best Practices

### When to Use Each Agent

**Senior Code Reviewer**:
- ✅ After completing features
- ✅ Before deploying to production
- ✅ When debugging complex issues
- ❌ Not for quick syntax fixes

**Code Refactorer**:
- ✅ Large files (>500 lines)
- ✅ Technical debt cleanup
- ✅ Before adding features to old code
- ❌ Not for new greenfield code

**Git Commit Helper**:
- ✅ Complex multi-file changes
- ✅ Breaking changes
- ✅ Team collaboration
- ❌ Not for simple "fix typo" commits

**System Architect**:
- ✅ New application planning
- ✅ Major refactoring
- ✅ Scaling decisions
- ❌ Not for implementation details

**Staff Engineer**:
- ✅ Process improvements
- ✅ Standards establishment
- ✅ Technical strategy
- ❌ Not for tactical coding

**Premium UX Designer**:
- ✅ UI/UX improvements
- ✅ Accessibility audits
- ✅ Design system work
- ❌ Not for backend code

### Agent Chaining

You can chain agents for complete workflows:

```bash
# 1. Plan
/agents system-architect
Design real-time notification system

# 2. Review architecture
/agents staff-engineer
Review the notification system design

# 3. Implement (regular Claude Code)
[Code the feature]

# 4. Review code
/agents senior-code-reviewer
Review notification system implementation

# 5. Refactor
/agents code-refactorer
Optimize notification-service.ts

# 6. UX check
/agents premium-ux-designer
Review notification UI components

# 7. Commit
/agents git-commit-helper
Create commit for notification system
```

---

## 📊 Agent Comparison

| Agent | Focus | Speed | Depth | Best For |
|-------|-------|-------|-------|----------|
| Senior Code Reviewer | Code quality | Medium | Deep | Security, performance |
| Code Refactorer | Code structure | Fast | Medium | Maintainability |
| Git Commit Helper | Commit messages | Fast | Light | Documentation |
| System Architect | Architecture | Slow | Very Deep | Planning, design |
| Staff Engineer | Leadership | Medium | Deep | Standards, strategy |
| Premium UX Designer | UI/UX | Medium | Deep | User experience |

**Speed**: Time to complete task
**Depth**: Level of analysis detail

---

## 🔧 Troubleshooting

### Agent Not Found

**Error**: `Unknown slash command: agents`

**Solution**: Ensure agents are in `.claude/agents/` directory

### Agent Too Slow

**Issue**: Agent taking too long

**Solutions**:
- Use more specific prompts
- Limit scope to specific files
- Use lighter agents (e.g., Code Refactorer instead of System Architect)

### Agent Context Issues

**Issue**: Agent doesn't understand Lumiku project context

**Solution**: Provide context in prompt:
```bash
/agents senior-code-reviewer

Context: Lumiku is a SaaS platform for AI content creation
using Hono (backend), React (frontend), Prisma (database).

Review avatar-creator/services/*.ts for:
...
```

---

## 📚 Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Sub-Agents Guide](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [Awesome Claude Code Agents](https://github.com/EricTechPro/awesome-claude-code-agents)
- [YouTube Tutorial](https://youtu.be/aK3dky0zpj0)

---

## 🎯 Recommended Agent Usage for Lumiku

### For New Plugins
1. System Architect → Plan architecture
2. (Implement in regular mode)
3. Senior Code Reviewer → Review implementation
4. Code Refactorer → Clean up code
5. Git Commit Helper → Professional commit

### For Bug Fixes
1. code-reviewer-debugger → Find root cause
2. (Fix in regular mode)
3. Senior Code Reviewer → Verify fix
4. Git Commit Helper → Document fix

### For UI Improvements
1. Premium UX Designer → Design improvements
2. (Implement in regular mode)
3. Senior Code Reviewer → Code quality check
4. Git Commit Helper → Document changes

### For Architecture Reviews
1. System Architect → High-level design
2. Staff Engineer → Standards & best practices
3. Senior Code Reviewer → Implementation review

---

## 📝 Contributing

To add new custom agents for Lumiku:

1. Create `<agent-name>.md` in `.claude/agents/`
2. Follow agent template structure
3. Document use cases in this README
4. Test agent with real scenarios
5. Commit and share with team

---

**Last Updated**: 2025-10-13
**Agents Installed**: 6 (+ 2 coming soon)
**Source**: [awesome-claude-code-agents](https://github.com/EricTechPro/awesome-claude-code-agents)
