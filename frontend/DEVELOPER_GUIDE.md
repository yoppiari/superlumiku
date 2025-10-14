# Frontend Developer Guide

Quick reference guide for working with the refactored Lumiku App frontend codebase.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Service Layer](#service-layer)
3. [UI Components](#ui-components)
4. [Error Handling](#error-handling)
5. [Common Patterns](#common-patterns)
6. [Best Practices](#best-practices)

---

## Project Structure

```
frontend/src/
├── services/          # API service layer
├── components/        # React components
│   └── ui/           # Reusable UI components
├── lib/              # Utilities and helpers
├── pages/            # Page components
├── apps/             # App-specific components
├── stores/           # Zustand state stores
└── types/            # TypeScript types
```

---

## Service Layer

### Available Services

All services are located in `src/services/` and can be imported like:

```typescript
import { authService, creditsService, generationService } from '../services'
```

### Auth Service

```typescript
// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'password'
})

// Register
const { user, token } = await authService.register({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe'
})

// Logout
authService.logout()
```

### Credits Service

```typescript
// Get balance
const { balance } = await creditsService.getBalance()

// Get transaction history
const transactions = await creditsService.getHistory()

// Create payment
const { paymentUrl } = await creditsService.createPayment({
  packageId: 'pkg-123',
  credits: 1000,
  amount: 100000,
  productName: 'Credit Package',
  type: 'topup'
})
```

### Generation Service

```typescript
// Get all generations
const { generations } = await generationService.getGenerations({
  app: 'video-mixer',
  sort: 'latest',
  limit: 100
})

// Get recent generations
const { generations } = await generationService.getRecentGenerations(5)

// Delete generation
await generationService.deleteGeneration('gen-123', 'app-id')
```

### Dashboard Service

```typescript
// Get apps
const { apps } = await dashboardService.getApps()

// Get stats
const stats = await dashboardService.getStats()
```

### Video Generator Service

```typescript
// Get projects
const { projects } = await videoGeneratorService.getProjects()

// Get project
const { project } = await videoGeneratorService.getProject('proj-123')

// Create project
const { project } = await videoGeneratorService.createProject({
  name: 'My Project',
  description: 'Optional description'
})

// Delete project
await videoGeneratorService.deleteProject('proj-123')

// Get models
const { models } = await videoGeneratorService.getModels()

// Generate video
await videoGeneratorService.generateVideo({
  projectId: 'proj-123',
  modelId: 'model-123',
  prompt: 'A beautiful sunset',
  resolution: '720p',
  duration: 5,
  aspectRatio: '16:9'
})
```

---

## UI Components

### Import

```typescript
import { Button, Card, Input, LoadingSpinner, EmptyState, Badge, PageHeader } from '../components/ui'
```

### Button

```tsx
// Basic button
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button isLoading>Loading...</Button>

// With icons
<Button leftIcon={<Icon />}>With Icon</Button>
<Button rightIcon={<Icon />}>With Icon</Button>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</Card>

// Variants
<Card variant="default">Default</Card>
<Card variant="bordered">Bordered</Card>
<Card variant="elevated">Elevated</Card>
```

### Input

```tsx
// Basic input
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password is required"
/>

// With helper text
<Input
  label="Username"
  helperText="Choose a unique username"
/>

// With icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
/>
```

### LoadingSpinner

```tsx
// Basic spinner
<LoadingSpinner />

// With size
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// With text
<LoadingSpinner text="Loading data..." />
```

### EmptyState

```tsx
<EmptyState
  icon={FolderOpen}
  title="No items found"
  description="Start by creating your first item"
  action={
    <Button onClick={handleCreate}>Create Item</Button>
  }
/>
```

### Badge

```tsx
// Variants
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
```

### PageHeader

```tsx
<PageHeader
  title="Page Title"
  description="Page description"
  icon={Film}
  iconColor="bg-blue-50 text-blue-700"
  backButton
  backPath="/dashboard"
  actions={
    <Button>Action Button</Button>
  }
/>
```

---

## Error Handling

### Import

```typescript
import { handleApiError, extractErrorMessage } from '../lib/errorHandler'
```

### Usage

```typescript
// Standard pattern
try {
  const data = await service.getData()
  // Handle success
} catch (error) {
  const errorDetails = handleApiError(error, 'Fetch data')
  // Show error to user
  alert(errorDetails.message)
  // or
  setError(errorDetails.message)
}

// Just extract message
try {
  await service.doSomething()
} catch (error) {
  const message = extractErrorMessage(error)
  setError(message)
}
```

---

## Common Patterns

### Fetching Data

```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await service.getData()
      setData(response.data)
    } catch (err) {
      const errorDetails = handleApiError(err, 'Fetch data')
      setError(errorDetails.message)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])
```

### Rendering with Loading & Empty States

```tsx
{loading ? (
  <LoadingSpinner text="Loading..." />
) : error ? (
  <div className="text-red-600">{error}</div>
) : data.length === 0 ? (
  <EmptyState
    icon={Icon}
    title="No items"
    description="No items found"
  />
) : (
  data.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))
)}
```

### Form Submission

```typescript
const [formData, setFormData] = useState({ name: '', email: '' })
const [isSubmitting, setIsSubmitting] = useState(false)
const [error, setError] = useState('')

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setIsSubmitting(true)

  try {
    await service.submitForm(formData)
    // Handle success
    navigate('/success')
  } catch (err) {
    const errorDetails = handleApiError(err, 'Submit form')
    setError(errorDetails.message)
  } finally {
    setIsSubmitting(false)
  }
}

// In JSX
<form onSubmit={handleSubmit}>
  <Input
    label="Name"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    error={error}
  />
  <Button type="submit" isLoading={isSubmitting}>
    Submit
  </Button>
</form>
```

### Authentication Check

```typescript
import { useAuthStore } from '../stores/authStore'

const { user, isAuthenticated } = useAuthStore()

useEffect(() => {
  if (!isAuthenticated) {
    navigate('/login')
  }
}, [isAuthenticated, navigate])
```

---

## Best Practices

### 1. Always Use Services for API Calls

❌ **Don't**
```typescript
const response = await api.get('/api/credits/balance')
```

✅ **Do**
```typescript
const balance = await creditsService.getBalance()
```

### 2. Use Error Handler

❌ **Don't**
```typescript
.catch((err) => console.error(err))
```

✅ **Do**
```typescript
catch (error) {
  handleApiError(error, 'Context')
}
```

### 3. Use Reusable Components

❌ **Don't**
```tsx
<div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
  Click me
</div>
```

✅ **Do**
```tsx
<Button variant="primary">Click me</Button>
```

### 4. Implement Loading States

❌ **Don't**
```tsx
{data && data.map(...)}
```

✅ **Do**
```tsx
{loading ? <LoadingSpinner /> : data.map(...)}
```

### 5. Handle Empty States

❌ **Don't**
```tsx
{data.length === 0 && <div>No data</div>}
```

✅ **Do**
```tsx
{data.length === 0 && (
  <EmptyState
    icon={Icon}
    title="No data"
    description="Description"
  />
)}
```

### 6. Type Everything

❌ **Don't**
```typescript
const fetchData = async () => {
  const response = await service.getData()
  return response
}
```

✅ **Do**
```typescript
const fetchData = async (): Promise<DataType[]> => {
  const response = await service.getData()
  return response.data
}
```

### 7. Use Async/Await

❌ **Don't**
```typescript
service.getData()
  .then(data => setData(data))
  .catch(err => setError(err))
```

✅ **Do**
```typescript
try {
  const data = await service.getData()
  setData(data)
} catch (error) {
  handleApiError(error, 'Context')
}
```

---

## Quick Checklist for New Features

- [ ] Use services for all API calls
- [ ] Implement proper error handling
- [ ] Use reusable UI components
- [ ] Add loading states
- [ ] Add empty states
- [ ] Type all data structures
- [ ] Test with different states (loading, error, empty, success)
- [ ] Ensure responsive design
- [ ] Check accessibility (keyboard navigation, ARIA labels)
- [ ] Clean up console.logs before committing

---

## Getting Help

- See `REFACTORING_SUMMARY.md` for detailed refactoring documentation
- Check existing pages for implementation examples
- Review service files for available methods
- Look at component files for usage examples

---

**Happy Coding! 🚀**
