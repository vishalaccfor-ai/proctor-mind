# Proctor Mind

**MHT-CET AI Exam Preparation Platform**

> The only MHT-CET platform that learns with you — from your first chapter to your last mock.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL + RLS + Triggers)
- **AI Features:** Supabase Edge Functions → OpenAI GPT-4o-mini
- **Charts:** Recharts
- **Hosting:** Vercel
- **Payments:** Razorpay

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```sh
# Clone the repository
git clone https://github.com/vishalaccfor-ai/proctor-mind.git
cd proctor-mind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials in .env

# Start development server
npm run dev
```

App runs at `http://localhost:8080`

## Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the file:
   `supabase/migrations/20260305064532_*.sql`
3. Tables, RLS policies, and triggers are created automatically

## Project Structure

```
src/
├── components/        # Reusable UI components
│   └── ui/            # shadcn/ui base components
├── contexts/          # React context (Auth, Exam)
├── hooks/             # Custom React hooks
├── integrations/      # Supabase client + generated types
├── lib/               # cn() utility
├── pages/             # Page components
└── types/             # TypeScript types
```

## Available Scripts

```sh
npm run dev       # Start dev server (port 8080)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run test      # Vitest
```

## Features (Roadmap)

- ✅ Student auth + admin roles
- ✅ Exam engine (timer, palette, tab-switch detection, auto-save)
- ✅ Results + subject-wise analytics
- ✅ Admin exam builder
- 🔜 AI feedback after every exam (GPT-4o-mini)
- 🔜 Wrong answer deep diagnosis
- 🔜 CET Readiness Score
- 🔜 Score prediction + college predictor
- 🔜 Daily streak + Question of the Day
- 🔜 Parent dashboard
- 🔜 Coaching institute B2B portal
- 🔜 Battle mode (multiplayer)
- 🔜 Marathi language interface

## Deployment

1. Connect GitHub repo to [Vercel](https://vercel.com)
2. Add environment variables in Vercel project settings
3. Every push to `main` auto-deploys

## License

Private — All rights reserved.
