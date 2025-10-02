# Add New App to Plugin Architecture

You are tasked with creating a complete new app for the Lumiku platform using the plugin architecture.

## Instructions

Ask the user for these details:
1. **App ID** (kebab-case, e.g., "invoice-generator")
2. **App Name** (display name, e.g., "Invoice Generator")
3. **Description** (short description)
4. **Icon** (Lucide icon name, e.g., "file-text")
5. **Color** (blue/green/purple/orange/red)
6. **Dashboard Order** (number for ordering)
7. **Database Models** (describe what models are needed)
8. **Main Features** (list of features with credit costs)

## Execution Steps

Once you have the details, execute these steps automatically:

### 1. Generate App Boilerplate
Run the app generator script:
```bash
cd backend && bun scripts/generate-app.ts <app-id> "<name>" "<description>" <icon> <color> <order>
```

### 2. Add Database Models
Edit `backend/prisma/schema.prisma` and add the required models at the end of the file.
Then run migration:
```bash
cd backend && bun prisma migrate dev --name add-<app-id>-models
```

### 3. Update Plugin Config
Edit `backend/src/apps/<app-id>/plugin.config.ts` and update the credits object with actual feature costs provided by user.

### 4. Implement Business Logic

**Repository** (`backend/src/apps/<app-id>/repositories/<app-id>.repository.ts`):
- Implement all database CRUD operations
- Use Prisma client for queries
- Include proper relations and indexes

**Service** (`backend/src/apps/<app-id>/services/<app-id>.service.ts`):
- Implement business logic for each feature
- Add validation
- Handle errors properly
- Check ownership/authorization

### 5. Create API Routes
Edit `backend/src/apps/<app-id>/routes.ts`:
- Implement GET routes (no credit cost) for reading data
- Implement POST/PUT/DELETE routes with credit middleware
- Add Zod validation schemas
- Record credit usage after successful operations
- Return creditUsed and creditBalance in responses

### 6. Register Plugin
Edit `backend/src/plugins/loader.ts`:
- Import the plugin config and routes
- Add `pluginRegistry.register()` call

### 7. Create Frontend Component
Create `frontend/src/apps/<AppName>.tsx`:
- Beautiful, responsive UI
- List/Grid view of items
- Create form with validation
- Edit/Delete actions
- Credit cost indicators
- Real-time balance updates
- Handle insufficient credits (redirect to /credits)
- Loading and error states

### 8. Add Frontend Route
Edit `frontend/src/App.tsx`:
- Import the component
- Add route `/apps/<app-id>`

### 9. Update Icon Map (if needed)
If using a new icon, edit `frontend/src/pages/Dashboard.tsx`:
- Add icon to iconMap object

### 10. Test
- Verify backend server shows plugin loaded
- Test all CRUD operations
- Verify credit deductions
- Test UI responsiveness
- Test error handling

## Success Criteria

- ✅ App appears in dashboard
- ✅ All CRUD operations work
- ✅ Credits deducted correctly
- ✅ Credit balance updates in UI
- ✅ 402 error for insufficient credits
- ✅ Clean, professional UI
- ✅ No TypeScript errors
- ✅ Migrations applied successfully

## Report Back

After completion, provide:
1. Summary of what was created
2. API endpoints available
3. Credit costs per action
4. Screenshot-ready confirmation that app works

Execute all steps automatically without asking for confirmation between steps. Only ask for the initial app details.
