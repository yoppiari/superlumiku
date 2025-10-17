# Production Database Seed - Execution Checklist

Print this page and check off items as you complete them.

## Pre-Execution Checklist

- [ ] Reviewed `SEED_EXECUTION_SUMMARY.md`
- [ ] Have access to Coolify (https://cf.avolut.com) OR SSH
- [ ] Application status is "running:healthy"
- [ ] Backup database (optional but recommended)

## Execution Method (Choose One)

### [ ] Method 1: Coolify Web UI

1. [ ] Opened https://cf.avolut.com
2. [ ] Navigated to: Project > dev-superlumiku
3. [ ] Found Terminal or Execute Command section
4. [ ] Pasted command: `cd /app/backend && bunx prisma db seed`
5. [ ] Pressed Enter
6. [ ] Waited for completion (30-60 seconds)
7. [ ] Saw success message with ✅ symbols

### [ ] Method 2: SSH to Server

1. [ ] SSH connected: `ssh root@SERVER_IP`
2. [ ] Found container: `docker ps | grep d8ggwoo484k8ok48g8k8cgwk`
3. [ ] Noted container name: `_______________________________`
4. [ ] Executed seed command (see COPY_PASTE_SEED_COMMANDS.txt)
5. [ ] Saw success output

### [ ] Method 3: SQL Fallback

1. [ ] Connected to database: `docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev`
2. [ ] Ran INSERT statements from `SEED_PRODUCTION_SQL_FALLBACK.sql`
3. [ ] Verified 4 rows inserted
4. [ ] Exited psql: `\q`

## Verification Checklist

### Database Verification

- [ ] Ran count query:
  ```
  docker exec ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev \
    -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
  ```
- [ ] Result is exactly: **4**

- [ ] Ran list query:
  ```
  docker exec ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev \
    -c "SELECT id, name, tier, \"creditCost\" FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
  ```
- [ ] Saw 4 models:
  - [ ] FLUX.1-dev Base (FREE, 8 credits)
  - [ ] FLUX.1-schnell Fast (BASIC, 6 credits)
  - [ ] FLUX.1-dev + Realism LoRA (BASIC, 12 credits)
  - [ ] FLUX.1-dev HD + Realism LoRA (PRO, 15 credits)

### API Verification

- [ ] Tested API endpoint (replace YOUR_TOKEN):
  ```
  curl -H "Authorization: Bearer YOUR_TOKEN" https://dev.lumiku.com/api/apps
  ```
- [ ] Response includes Avatar Creator app
- [ ] App has correct metadata

### Dashboard Verification

- [ ] Opened https://dev.lumiku.com
- [ ] Logged in successfully
- [ ] Navigated to Dashboard
- [ ] Avatar Creator app is visible
- [ ] App shows correct icon
- [ ] App description is present

### UI Functionality Verification

- [ ] Clicked on Avatar Creator app
- [ ] Page loaded without errors
- [ ] AI model dropdown is present
- [ ] Dropdown shows 4 models
- [ ] Model names match database
- [ ] Credit costs are displayed correctly

### Generation Test

- [ ] Selected AI model: `_______________`
- [ ] Entered test prompt: "professional business headshot"
- [ ] Clicked "Generate Avatar"
- [ ] Generation started (status: "pending" or "generating")
- [ ] No error messages appeared
- [ ] Generation completed successfully
- [ ] Avatar image is displayed
- [ ] Credits were deducted (check balance)
- [ ] Avatar appears in history/gallery

## Troubleshooting Used (if any)

- [ ] Generated Prisma client first
- [ ] Used alternative command with `bun` instead of `bunx`
- [ ] Checked DATABASE_URL environment variable
- [ ] Cleared browser cache
- [ ] Used SQL fallback method
- [ ] Other: `_______________________________`

## Final Status

### Success Criteria
- [ ] All 4 AI models in database
- [ ] Avatar Creator visible in dashboard
- [ ] Test generation completed successfully
- [ ] Credits deducted correctly
- [ ] No errors in browser console
- [ ] No errors in application logs

### Sign-Off

**Date Executed**: `_______________`

**Time Started**: `_______________`

**Time Completed**: `_______________`

**Total Duration**: `_______________`

**Method Used**: Method # `___`

**Executed By**: `_______________`

**Result**: [ ] SUCCESS  [ ] FAILED (see notes below)

**Notes**:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## Next Steps After Success

- [ ] Notify team that Avatar Creator is live
- [ ] Monitor application logs for 24 hours
- [ ] Test with different user tiers (FREE, BASIC, PRO)
- [ ] Verify billing/credit deduction works correctly
- [ ] Update user documentation
- [ ] Plan deployment for other AI apps (Pose Generator, etc.)

## If Issues Persist

Contact support with:
- [ ] Copy of this checklist
- [ ] Container logs: `docker logs CONTAINER_NAME --tail 100`
- [ ] Database query results
- [ ] Browser console errors (F12 → Console)
- [ ] Screenshots of any errors

## Reference Files

- Summary: `SEED_EXECUTION_SUMMARY.md`
- Detailed guide: `EXECUTE_SEED_IN_PRODUCTION.md`
- Quick commands: `COPY_PASTE_SEED_COMMANDS.txt`
- Bash script: `SEED_PRODUCTION_QUICK_COMMANDS.sh`
- SQL fallback: `SEED_PRODUCTION_SQL_FALLBACK.sql`
- Flowchart: `SEED_EXECUTION_FLOWCHART.md`

---

**Status**: [ ] Not Started  [ ] In Progress  [ ] Completed  [ ] Failed

**Last Updated**: 2025-10-17
