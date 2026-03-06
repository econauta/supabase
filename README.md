# Sentinela

Seu guardião de projetos Supabase. Uma aplicação moderna para monitorar uptime e métricas de saúde dos seus projetos, construída com React, TypeScript, Vite e Supabase.

## Features

- Real-time service monitoring
- Health metrics and uptime tracking
- Wake logs and incident management
- Project health indicators
- Latency charts and statistics
- Multi-language support (PT-BR)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

   Get your Supabase URL and anon key from:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Deploying to Vercel

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Step 2: Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

To add environment variables:
1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Navigate to "Environment Variables"
4. Add each variable with its value
5. Make sure to select all environments (Production, Preview, Development)

### Step 4: Deploy

Click "Deploy" and Vercel will automatically build and deploy your application!

## Database Setup

The project includes Supabase migrations in the `supabase/migrations` folder:

- `20260113160316_create_profiles_table.sql` - User profiles
- `20260113160328_create_projects_table.sql` - Projects/services to monitor
- `20260113160340_create_wake_logs_table.sql` - Wake/ping logs
- `20260113173834_expand_wake_logs_with_metrics.sql` - Extended metrics
- `20260113173857_create_project_health_metrics.sql` - Health metrics
- `20260113173918_create_project_incidents.sql` - Incident tracking
- `20260114140725_add_display_order_to_projects.sql` - Project ordering

These migrations are automatically applied to your Supabase database.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/        # React components
│   ├── dashboard/    # Dashboard-specific components
│   ├── layout/       # Layout components (Header, etc.)
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts (Auth, etc.)
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization
│   ├── config.ts
│   └── locales/      # Translation files
├── lib/              # Utility libraries
├── pages/            # Page components
├── types/            # TypeScript type definitions
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key | Yes |

## Security

- Row Level Security (RLS) is enabled on all database tables
- Authentication is required for all operations
- Environment variables are never exposed to the client
- HTTPS is enforced on Vercel deployments

## Support

For issues and questions, please open an issue on GitHub.

## License

This project is private and proprietary.
