# Git Branch Policy for Lumiku

## Default Branch: `development`

**IMPORTANT**: Always work on and push to the `development` branch for this project.

## Branch Structure

- **`development`** (DEFAULT) - Main development branch, deployed to https://dev.lumiku.com
- **`main`** - Production branch, deployed to https://app.lumiku.com
- **Feature branches** - Created from `development`, merged back to `development`

## Workflow

### Daily Development
```bash
# Always ensure you're on development branch
git checkout development
git pull origin development

# Make changes
git add .
git commit -m "Your commit message"
git push origin development
```

### Coolify Deployments
- **dev.lumiku.com** → Autodeploys from `development` branch
- **app.lumiku.com** → Autodeploys from `main` branch (production)

### When to Merge to Main
Only merge `development` → `main` when:
1. Features are tested and stable
2. Ready for production release
3. After team approval

```bash
git checkout main
git merge development
git push origin main
```

## Why Development Branch?

1. **Safe Testing** - Test features on dev.lumiku.com before production
2. **Continuous Deployment** - Coolify autodeploys from development
3. **Team Collaboration** - Multiple developers can work simultaneously
4. **Production Stability** - Main branch stays stable for users

## Current Setup

- Coolify Application: `dev-superlumiku` (d8ggwoo484k8ok48g8k8cgwk)
- Deployment Branch: `development`
- Live URL: https://dev.lumiku.com
- Auto-deploy: Enabled ✅

---

**Remember**: Always commit to `development` first!
