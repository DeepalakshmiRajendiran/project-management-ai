# Project Management Dashboard

A modern, responsive React.js dashboard for project management with real-time data visualization, filtering, and comprehensive project tracking capabilities.

## Features

### 🎯 Core Dashboard Features
- **Project Overview**: Visual display of all projects with status indicators and progress bars
- **Real-time Statistics**: Interactive charts showing project distribution by status and priority
- **Advanced Filtering**: Search and filter projects by status, priority, and text search
- **Responsive Design**: Mobile-first design that works on all devices
- **Visual Progress Tracking**: Progress bars and status badges for quick project assessment

### 📊 Data Visualization
- **Pie Charts**: Project status distribution
- **Bar Charts**: Priority distribution
- **Progress Bars**: Individual project completion tracking
- **Key Metrics**: Total projects, active projects, completed projects, on-hold projects

### 🔍 Search & Filter Capabilities
- **Text Search**: Search projects by name and description
- **Status Filtering**: Filter by Active, Completed, On Hold, Cancelled
- **Priority Filtering**: Filter by Low, Medium, High, Urgent
- **Combined Filters**: Use multiple filters simultaneously
- **Filter Management**: Clear individual filters or all filters at once

### 📱 User Experience
- **Grid/List View**: Toggle between grid and list view modes
- **Collapsible Stats**: Show/hide dashboard statistics
- **Loading States**: Smooth loading indicators
- **Error Handling**: Graceful error states with retry options
- **Empty States**: Helpful messages when no data is available

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Beautiful and composable charts
- **Lucide React**: Beautiful & consistent icon toolkit
- **Axios**: HTTP client for API communication
- **Date-fns**: Modern JavaScript date utility library

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx      # Main layout with sidebar
│   │   ├── ProjectCard.jsx # Individual project card
│   │   ├── ProjectFilters.jsx # Search and filter controls
│   │   └── DashboardStats.jsx # Statistics and charts
│   ├── contexts/           # React context providers
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ProjectContext.jsx # Project data management
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx   # Main dashboard page
│   │   └── ProjectDetails.jsx # Individual project view
│   ├── services/           # API services
│   │   └── api.js         # API client and endpoints
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── index.html            # HTML template
```

## API Integration

The dashboard integrates with a comprehensive REST API that provides:

### Authentication
- User login/registration
- JWT token management
- Protected routes

### Project Management
- CRUD operations for projects
- Project statistics and metrics
- Milestone and task management
- Team member management

### Data Endpoints
- `/api/projects` - Project management
- `/api/milestones` - Milestone tracking
- `/api/tasks` - Task management
- `/api/team` - Team management
- `/api/auth` - Authentication

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Setup
The dashboard is configured to proxy API requests to the backend:
- Development: `http://localhost:5173` → `http://localhost:3000/api`
- Production: Configure your API base URL

## Key Components

### Dashboard Layout
- **Responsive Sidebar**: Navigation with collapsible mobile menu
- **Top Bar**: User info and quick actions
- **Main Content**: Dynamic content area with routing

### Project Cards
- **Visual Status**: Color-coded status badges
- **Progress Bars**: Real-time completion tracking
- **Key Information**: Dates, budget, team size
- **Quick Actions**: View details, edit, delete

### Filtering System
- **Search Input**: Real-time text search
- **Dropdown Filters**: Status and priority selection
- **Active Filter Display**: Visual filter indicators
- **Clear Options**: Individual or bulk filter clearing

### Statistics Dashboard
- **Metric Cards**: Key performance indicators
- **Interactive Charts**: Recharts-powered visualizations
- **Quick Actions**: Common user actions
- **Responsive Layout**: Adapts to screen size

## Styling

The dashboard uses Tailwind CSS with custom components:

### Custom Classes
- `.btn` - Button base styles
- `.btn-primary` - Primary button variant
- `.btn-secondary` - Secondary button variant
- `.card` - Card container styles
- `.input` - Form input styles
- `.status-badge` - Status indicator styles
- `.priority-badge` - Priority indicator styles

### Color System
- **Primary**: Blue shades for main actions
- **Success**: Green for completed/positive states
- **Warning**: Yellow for on-hold/attention states
- **Danger**: Red for cancelled/error states
- **Gray**: Neutral colors for secondary elements

## State Management

### Context Providers
- **AuthContext**: Manages user authentication state
- **ProjectContext**: Handles project data and filtering

### Data Flow
1. **API Calls**: Centralized in `services/api.js`
2. **Context Updates**: State changes trigger re-renders
3. **Component Updates**: UI reflects current state
4. **Error Handling**: Graceful error states

## Performance Features

- **Lazy Loading**: Components load on demand
- **Memoization**: Optimized re-renders
- **Debounced Search**: Efficient search performance
- **Optimized Charts**: Responsive chart rendering
- **Code Splitting**: Route-based code splitting

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Graceful degradation

## Contributing

1. Follow the existing code structure
2. Use TypeScript for new components (optional)
3. Add tests for new features
4. Update documentation
5. Follow the established naming conventions

## License

This project is part of a comprehensive project management system.

---

**Built with ❤️ using React, Vite, and Tailwind CSS** 