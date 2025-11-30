# AI Code Generation Platform - Frontend

Next.js frontend application for the AI Code Generation Platform.

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Query for data fetching
- ✅ Zustand for state management
- ✅ Real-time updates with Socket.IO
- ✅ Authentication with JWT
- ✅ Responsive design

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/      # Dashboard pages
│   │   │   ├── dashboard/
│   │   │   └── projects/
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── providers.tsx    # App providers
│   ├── components/          # Reusable components
│   ├── lib/                # Utilities
│   │   └── api.ts         # API client
│   └── types/             # TypeScript types
│       └── index.ts
├── public/                # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── start.sh             # Startup script
```

## Setup

### Prerequisites

- Node.js 18+
- Backend API running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Pages

### Public Pages
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page

### Protected Pages (Requires Authentication)
- `/dashboard` - Main dashboard
- `/projects` - Projects list
- `/projects/new` - Create new project
- `/projects/[id]` - Project details
- `/projects/[id]/tasks` - Project tasks
- `/projects/[id]/settings` - Project settings

## Components

### Layouts
- `RootLayout` - Main application layout
- `DashboardLayout` - Dashboard layout with navigation

### UI Components
- `Button` - Reusable button component
- `Card` - Card component for content
- `Modal` - Modal dialog component
- `Table` - Data table component
- `Chart` - Chart components for analytics

### Feature Components
- `ProjectCard` - Project display card
- `TaskList` - Task list component
- `TaskCard` - Individual task card
- `ProgressTracker` - Progress visualization
- `NotificationCenter` - Notification center

## API Integration

The frontend communicates with the backend API using Axios:

```typescript
import apiClient from '@/lib/api'

// Get projects
const projects = await apiClient.get('/projects')

// Create project
const newProject = await apiClient.post('/projects', data)

// Update project
const updated = await apiClient.put(`/projects/${id}`, data)
```

## State Management

Using Zustand for global state:

```typescript
import { create } from 'zustand'

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

## Real-time Updates

Socket.IO client for real-time notifications:

```typescript
import { io } from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_WS_URL)

socket.on('task_updated', (data) => {
  // Handle task update
})
```

## Styling

Using Tailwind CSS for styling:

```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold mb-4">Title</h2>
</div>
```

## Authentication

JWT tokens are stored in localStorage:

```typescript
// Login
const { access_token } = await login(email, password)
localStorage.setItem('token', access_token)

// Logout
localStorage.removeItem('token')
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t ai-code-platform-frontend .

# Run container
docker run -p 3000:3000 ai-code-platform-frontend
```

### Static Export

```bash
npm run build
# Deploy the 'out' directory to your hosting service
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

