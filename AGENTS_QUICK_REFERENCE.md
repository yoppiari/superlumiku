# 🤖 Lumiku - Claude Code Agents Quick Reference

**Last Updated**: 2025-10-13
**Total Agents**: 8

---

## 📋 Quick Command Cheat Sheet

| Task | Command |
|------|---------|
| **Code Review** | `/agents senior-code-reviewer` |
| **Refactoring** | `/agents code-refactorer` |
| **Bug Finding** | `/agents code-reviewer-debugger` |
| **Architecture** | `/agents system-architect` |
| **UI/UX Design** | `/agents premium-ux-designer` |
| **Git Commits** | `/agents git-commit-helper` |
| **Technical Leadership** | `/agents staff-engineer` |
| **Deployment Help** | `/agents lumiku-deployment-specialist` |

---

## 🚀 Common Workflows

### 1. New Feature Development
```bash
# Step 1: Plan architecture
/agents system-architect
Plan architecture for [feature name]

# Step 2: Implement (regular Claude Code)
[Write the code]

# Step 3: Review
/agents senior-code-reviewer
Review [feature] implementation for security and performance

# Step 4: Commit
/agents git-commit-helper
Create commit for [feature]
```

### 2. Production Bug Fix
```bash
# Step 1: Debug
/agents code-reviewer-debugger
Debug [issue description]

# Step 2: Fix (regular mode)
[Fix the bug]

# Step 3: Verify
/agents senior-code-reviewer
Verify fix for [bug]

# Step 4: Deploy
/agents lumiku-deployment-specialist
Help deploy hotfix to production
```

### 3. UI Improvement
```bash
# Step 1: Design review
/agents premium-ux-designer
Review [component] UI and suggest improvements

# Step 2: Implement
[Make changes]

# Step 3: Code review
/agents senior-code-reviewer
Review [component] for accessibility
```

### 4. Deployment Troubleshooting
```bash
# Use deployment specialist
/agents lumiku-deployment-specialist
[Describe deployment issue]

# Examples:
- TypeScript build error on line X
- App not showing on dashboard
- Database migration failed
- Worker not processing jobs
```

---

## 💡 When to Use Which Agent

### Senior Code Reviewer 🔍
**Use when**:
- ✅ Completed major feature
- ✅ Before production deploy
- ✅ Security audit needed
- ✅ Performance optimization

**Example**:
```bash
/agents senior-code-reviewer

Review backend/src/apps/avatar-creator/services/avatar-creator.service.ts
Focus on:
- Security (file upload validation)
- Performance (N+1 queries)
- Error handling
```

### Code Refactorer 🧹
**Use when**:
- ✅ File >500 lines
- ✅ Repeated code patterns
- ✅ Technical debt cleanup
- ✅ Code smells detected

**Example**:
```bash
/agents code-refactorer

Refactor frontend/src/apps/AvatarCreator.tsx:
- Split into smaller components
- Extract modal components
- Follow DRY principle
```

### Code Reviewer Debugger 🐛
**Use when**:
- ✅ Production bugs
- ✅ Complex debugging
- ✅ Root cause analysis
- ✅ Performance issues

**Example**:
```bash
/agents code-reviewer-debugger

Avatar generation stuck at pending status.
Worker logs show no errors.
Redis queue has 10 waiting jobs.
```

### System Architect 🏗️
**Use when**:
- ✅ Planning new app
- ✅ Major refactoring
- ✅ Scaling decisions
- ✅ Tech stack choices

**Example**:
```bash
/agents system-architect

Design architecture for:
- Real-time avatar generation tracking
- WebSocket vs polling trade-offs
- Caching strategy
```

### Staff Engineer 👔
**Use when**:
- ✅ Setting standards
- ✅ Process improvements
- ✅ Team best practices
- ✅ Technical strategy

**Example**:
```bash
/agents staff-engineer

Establish:
- Plugin development workflow
- Testing strategy
- Code review process
- Error handling patterns
```

### Premium UX Designer 🎨
**Use when**:
- ✅ UI improvements
- ✅ Accessibility audit
- ✅ Mobile responsive
- ✅ Design system updates

**Example**:
```bash
/agents premium-ux-designer

Review Dashboard.tsx:
- Improve card layouts
- Better loading states
- Mobile responsiveness
- WCAG accessibility
```

### Git Commit Helper 📝
**Use when**:
- ✅ Complex changes
- ✅ Breaking changes
- ✅ Multiple files
- ✅ Team collaboration

**Example**:
```bash
/agents git-commit-helper

Create commit for:
- Added 3 FLUX AI models
- Fixed dashboard display
- Updated seed file
```

### Deployment Specialist 🚀
**Use when**:
- ✅ Deployment fails
- ✅ Build errors
- ✅ Database issues
- ✅ Production bugs
- ✅ Worker problems

**Example**:
```bash
/agents lumiku-deployment-specialist

TypeScript error during build:
src/apps/AvatarCreator.tsx(807,3): error TS6133
```

---

## 📊 Agent Selection Matrix

| Scenario | Primary Agent | Secondary Agent |
|----------|--------------|-----------------|
| New plugin | System Architect | Senior Code Reviewer |
| Bug fix | Code Reviewer Debugger | Senior Code Reviewer |
| UI improvement | Premium UX Designer | Senior Code Reviewer |
| Refactoring | Code Refactorer | Senior Code Reviewer |
| Deployment issue | Deployment Specialist | Staff Engineer |
| Code review | Senior Code Reviewer | Code Refactorer |
| Architecture review | System Architect | Staff Engineer |
| Standards | Staff Engineer | System Architect |

---

## 🎯 Pro Tips

### 1. Be Specific
❌ **Bad**: "Review this code"
✅ **Good**: "Review avatar-creator.service.ts for SQL injection vulnerabilities"

### 2. Provide Context
```bash
/agents senior-code-reviewer

Context: Lumiku SaaS platform, Hono + React + Prisma

Review backend/src/apps/avatar-creator/routes.ts for:
- File upload security
- Rate limiting
- Input validation
```

### 3. Chain Agents
For complex tasks, use multiple agents in sequence:
```
System Architect → Implement → Senior Code Reviewer → Refactor → Git Commit
```

### 4. Limit Scope
Focus on specific files or issues for faster results:
```bash
/agents code-refactorer

Refactor only these 3 files:
- AvatarCreator.tsx (933 lines)
- Dashboard.tsx (397 lines)
- VideoMixer.tsx (650 lines)
```

### 5. Use Right Agent for Right Task
- Architecture questions → System Architect
- Implementation bugs → Code Reviewer Debugger
- Code quality → Senior Code Reviewer
- UI/UX → Premium UX Designer

---

## 🚨 Common Issues & Solutions

### Issue: Agent Too Slow
**Solution**: Narrow scope, use lighter agent
```bash
# ❌ Slow
/agents system-architect
Review entire codebase

# ✅ Fast
/agents code-refactorer
Refactor AvatarCreator.tsx
```

### Issue: Agent Doesn't Understand Context
**Solution**: Provide more context
```bash
/agents senior-code-reviewer

Context:
- Lumiku = SaaS platform
- Stack: Hono, React, Prisma
- Current issue: [describe]

Review: [specific files]
```

### Issue: Wrong Agent Used
**Examples**:
- ❌ System Architect for syntax fix → Use Code Refactorer
- ❌ Premium UX Designer for backend → Use Senior Code Reviewer
- ❌ Staff Engineer for quick bug → Use Code Reviewer Debugger

---

## 📚 Real Examples from Today

### Example 1: Finding Root Cause (SUCCESS!)
```bash
/agents code-reviewer-debugger

Avatar Creator deployed but not showing on dashboard.
Backend health check OK.
Icon mapping exists.
TypeScript builds pass.
```

**Result**: Found missing AI models in database! 🎯

### Example 2: TypeScript Fixes
```bash
/agents senior-code-reviewer

Check frontend TypeScript for:
- Unused variables
- Type mismatches
- Browser compatibility
```

**Result**: Fixed 2 TypeScript errors, deployment succeeded ✅

---

## 🔗 Resources

- **Full Documentation**: `.claude/agents/README.md`
- **Source**: [awesome-claude-code-agents](https://github.com/EricTechPro/awesome-claude-code-agents)
- **Claude Code Docs**: [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code)

---

## 📞 Need Help?

**Can't decide which agent?**
1. Read agent description in `.claude/agents/README.md`
2. Check "When to Use" section above
3. When in doubt, start with **Senior Code Reviewer**

**Agent not working?**
1. Check agent file exists in `.claude/agents/`
2. Restart Claude Code
3. Try with more specific prompt

**Want custom agent?**
1. Copy existing agent structure
2. Customize system prompt
3. Save as `.md` file in `.claude/agents/`
4. Document in README

---

## 🎉 Quick Start

**First time using agents?**

Try this simple workflow:

```bash
# 1. Review some existing code
/agents senior-code-reviewer
Review backend/src/apps/avatar-creator/services/avatar-creator.service.ts

# 2. See what it finds
# 3. Apply suggestions
# 4. Use git commit helper

/agents git-commit-helper
Create commit for avatar creator improvements
```

**For today's deployment fix:**

```bash
# Check what needs to be done
/agents lumiku-deployment-specialist
Avatar Creator not showing on dashboard after deployment.
All fixes committed: 50c133b (AI models added).
Need help with seed command on server.
```

---

**Happy Coding with Specialized Agents! 🚀**

Print this out or keep it bookmarked for daily reference!
