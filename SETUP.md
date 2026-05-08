# Samsara RMS - Setup & Development Guide

## Project Overview

Samsara RMS is a comprehensive reservation management system with:
- **Website**: Next.js frontend application with dashboard, client management, reservations, suppliers, and more
- **Backend System**: Reservation processing, recommendations engine, and analytics

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dilan-nimsha/samsara.git
   cd samsara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials and other API keys:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Install concurrently for multi-process development**
   ```bash
   npm install
   ```

## Development

### Run Website Only
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Run Website + Backend System
```bash
npm run dev:all
```
This command runs both the website and backend system concurrently.

### Run with Specific Port
```bash
npm run dev -- -p 3001
```

## Building

### Build Website Only
```bash
npm run build
npm start
```

### Build All (Website + Backend)
```bash
npm run build:all
npm run start:all
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard
│   ├── reservations/      # Reservation management
│   ├── clients/           # Client management
│   ├── suppliers/         # Supplier management
│   ├── fleet/             # Fleet management
│   ├── finance/           # Finance & billing
│   ├── analytics/         # Analytics pages
│   ├── rates/             # Rate management
│   ├── guides/            # User guides
│   ├── partners/          # Partner management
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Utility functions
│   ├── recommendations/   # Recommendation engine
│   ├── supabase/         # Supabase client & queries
│   └── utils.ts          # Common utilities
└── types/                 # TypeScript types
```

## Branches

- **main**: Production-ready code
- **samsara-dms**: Development branch
- **feature/reservation-system**: Dedicated branch for reservation system development

## Features

### Current Features
- Dashboard with key metrics
- Client management system
- Reservation booking and management
- Supplier management
- Fleet tracking
- Financial management
- Analytics and reporting
- Recommendation engine
- Dynamic rate management
- PDF generation for documents

### Reservation System (feature/reservation-system branch)
Work in progress on dedicated branch for:
- Advanced reservation workflows
- Real-time availability management
- Automated recommendations
- Enhanced analytics

## API Routes

- `/api/notify` - Notification system
- `/api/recommendations` - Recommendation engine API

## Database

Uses Supabase PostgreSQL with schema defined in `supabase/schema.sql`

## Linting

```bash
npm run lint
```

## Performance

See [PERFORMANCE.md](./PERFORMANCE.md) for optimization details and best practices.

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check database is accessible
- Review Supabase credentials in `.env.local`

## Contributing

1. Create a feature branch from `samsara-dms`
2. Make changes and test thoroughly
3. Commit with clear messages
4. Push to GitHub and create a Pull Request
5. Review and merge to `samsara-dms`, then to `main`

## Git Workflow

```bash
# Check current branch
git branch

# Switch to a branch
git checkout feature/reservation-system

# Create a new feature branch
git checkout -b feature/your-feature-name

# Push changes
git push origin feature/your-feature-name
```

## License

Proprietary - Samsara RMS

## Support

For issues or questions, contact the development team.
