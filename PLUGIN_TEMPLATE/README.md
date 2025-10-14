# Lumiku App Plugin Template

This is a complete boilerplate template for creating new apps in the Lumiku platform. Simply copy this folder, rename it, and customize the placeholders.

## Quick Start

1. **Copy this template folder:**
   ```bash
   cp -r PLUGIN_TEMPLATE backend/src/apps/your-app-name
   cp -r PLUGIN_TEMPLATE/frontend frontend/src/apps/YourAppName
   ```

2. **Find and replace all placeholders:**
   - `YOUR_APP` → your-app-name (kebab-case)
   - `YourApp` → YourAppName (PascalCase)
   - `yourApp` → yourAppName (camelCase)
   - `Your App` → Your App Name (Display name)
   - `your-icon` → lucide-icon-name
   - `your-color` → blue|green|purple|orange|red|pink|indigo

3. **Add database models to** `backend/prisma/schema.prisma`

4. **Register plugin in** `backend/src/plugins/loader.ts`

5. **Add frontend route in** `frontend/src/App.tsx`

6. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_your_app_models
   npx prisma generate
   ```

7. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## Template Structure

```
PLUGIN_TEMPLATE/
├── README.md                           # This file
├── PLACEHOLDERS.md                     # List of all placeholders to replace
├── backend/
│   ├── plugin.config.ts                # Plugin configuration
│   ├── routes.ts                       # API endpoints
│   ├── types.ts                        # TypeScript interfaces
│   ├── services/
│   │   └── your-app.service.ts         # Business logic
│   └── repositories/
│       └── your-app.repository.ts      # Database queries (optional)
├── frontend/
│   ├── YourApp.tsx                     # Main React component
│   ├── stores/
│   │   └── yourAppStore.ts             # Zustand state management
│   └── components/
│       ├── CreateProjectModal.tsx      # Example modal component
│       └── README.md                   # Component guide
└── database/
    └── schema.prisma.example           # Example Prisma models

```

## Customization Checklist

### Backend

- [ ] Update `plugin.config.ts`:
  - [ ] Change `appId` to your app ID
  - [ ] Update `name` and `description`
  - [ ] Choose icon from [lucide.dev](https://lucide.dev/icons)
  - [ ] Set `routePrefix`
  - [ ] Define credit costs for each action
  - [ ] Configure access control
  - [ ] Set dashboard order and color

- [ ] Update `routes.ts`:
  - [ ] Rename route paths
  - [ ] Implement your endpoints
  - [ ] Add validation logic
  - [ ] Handle errors appropriately

- [ ] Update `types.ts`:
  - [ ] Define your request/response interfaces
  - [ ] Add domain models

- [ ] Create `services/your-app.service.ts`:
  - [ ] Implement business logic
  - [ ] Add credit deduction logic
  - [ ] Handle file uploads (if needed)
  - [ ] Implement AI generation (if needed)

- [ ] Add database models to `backend/prisma/schema.prisma`:
  - [ ] Define your models
  - [ ] Add proper indexes
  - [ ] Set up relations
  - [ ] Use `onDelete: Cascade` for parent-child

### Frontend

- [ ] Update `YourApp.tsx`:
  - [ ] Change component name
  - [ ] Update imports
  - [ ] Customize UI layout
  - [ ] Add your specific features

- [ ] Update `stores/yourAppStore.ts`:
  - [ ] Rename store hook
  - [ ] Define your state shape
  - [ ] Implement actions
  - [ ] Update API endpoints

- [ ] Create modal components (if needed):
  - [ ] Form modals for creating/editing
  - [ ] Confirmation modals
  - [ ] Preview modals

- [ ] Add route in `frontend/src/App.tsx`:
  ```typescript
  <Route path="/apps/your-app" element={<YourApp />} />
  <Route path="/apps/your-app/:projectId" element={<YourApp />} />
  ```

### Registration

- [ ] Register plugin in `backend/src/plugins/loader.ts`:
  ```typescript
  import yourAppConfig from '../apps/your-app/plugin.config'
  import yourAppRoutes from '../apps/your-app/routes'

  pluginRegistry.register(yourAppConfig, yourAppRoutes)
  ```

## Placeholder Reference

| Placeholder | Example | Usage |
|-------------|---------|-------|
| `YOUR_APP` | `invoice-generator` | File paths, URLs, IDs |
| `YourApp` | `InvoiceGenerator` | Component names, class names |
| `yourApp` | `invoiceGenerator` | Variable names, function names |
| `Your App` | `Invoice Generator` | Display text, titles |
| `your-icon` | `file-text` | Lucide icon name |
| `your-color` | `green` | Dashboard card color |

## Example: Converting Template to Invoice Generator

1. **Replace placeholders:**
   - `YOUR_APP` → `invoice-generator`
   - `YourApp` → `InvoiceGenerator`
   - `yourApp` → `invoiceGenerator`
   - `Your App` → `Invoice Generator`
   - `your-icon` → `file-text`
   - `your-color` → `green`

2. **Database models:**
   ```prisma
   model InvoiceProject {
     id          String   @id @default(cuid())
     userId      String
     name        String
     description String?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     invoices Invoice[]

     @@index([userId])
     @@map("invoice_projects")
   }

   model Invoice {
     id            String   @id @default(cuid())
     projectId     String
     userId        String
     invoiceNumber String   @unique
     clientName    String
     totalAmount   Float
     status        String   @default("unpaid")
     createdAt     DateTime @default(now())

     project InvoiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
     items   InvoiceItem[]

     @@index([projectId])
     @@index([userId])
     @@map("invoices")
   }

   model InvoiceItem {
     id          String @id @default(cuid())
     invoiceId   String
     description String
     quantity    Int
     unitPrice   Float
     totalPrice  Float

     invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

     @@index([invoiceId])
     @@map("invoice_items")
   }
   ```

3. **Credits configuration:**
   ```typescript
   credits: {
     createInvoice: 10,
     editInvoice: 3,
     deleteInvoice: 0,
     addLineItem: 1,
     generatePDF: 5,
     sendEmail: 3,
   }
   ```

4. **Implement service methods** for invoice creation, PDF generation, etc.

## Testing Your Plugin

1. **Test plugin registration:**
   ```bash
   curl http://localhost:3000/api/apps/your-app/health
   ```

2. **Test authentication:**
   ```bash
   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password"}'

   # Use token
   curl http://localhost:3000/api/apps/your-app/projects \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check frontend:**
   - Navigate to `http://localhost:5173/apps/your-app`
   - Verify the app shows in dashboard
   - Test all CRUD operations
   - Verify credit deduction works

## Common Issues

### Plugin Not Showing in Dashboard

**Problem:** App doesn't appear in the dashboard

**Solutions:**
- Check `features.enabled` is `true` in `plugin.config.ts`
- Verify `features.comingSoon` is `false`
- Ensure plugin is imported and registered in `loader.ts`
- Restart backend server

### Authorization Errors

**Problem:** Getting 401/403 errors

**Solutions:**
- Verify `authMiddleware` is applied to routes
- Check token is being sent in headers
- Ensure userId extraction works: `c.get('userId')`
- Verify database queries filter by userId

### Credit Deduction Issues

**Problem:** Credits not being deducted or deducted incorrectly

**Solutions:**
- Check credit amounts in `plugin.config.ts`
- Verify `creditService.deductCredits()` is called BEFORE operation
- Ensure insufficient credits throw error and stop execution
- Check credit transaction logs in database

### Database Errors

**Problem:** Prisma query errors

**Solutions:**
- Run `npx prisma generate` after schema changes
- Check foreign key relationships are correct
- Verify indexes are properly defined
- Use `onDelete: Cascade` for parent-child relations

### Frontend Not Updating

**Problem:** State not updating after API calls

**Solutions:**
- Check Zustand store actions update state correctly
- Verify API responses are handled properly
- Use `set()` function correctly in store
- Refresh current project after mutations

## Next Steps

1. Read the main guide: `docs/ADD_NEW_APP_PROMPT.md`
2. Review real examples: `backend/src/apps/avatar-creator/`
3. Check common pitfalls: `docs/COMMON_PITFALLS.md`
4. Follow tutorial: `docs/CAROUSEL_GENERATOR_TUTORIAL.md`

## Support

- Review existing apps in `backend/src/apps/` for patterns
- Check `docs/` folder for comprehensive guides
- Test incrementally as you build
- Use the template exactly as shown for consistency

---

Happy coding! Build something amazing on Lumiku.
