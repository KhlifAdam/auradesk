# AuraDesk

**AuraDesk** is a comprehensive, intelligent web platform designed for the presentation and management of photographic and audiovisual activities. It serves as a dual-purpose platform: a public-facing professional portfolio/booking site, and a private CRM/management workspace for photographers to handle clients, projects, media, and post-production workflows.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database:** PostgreSQL (Docker)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)
- **Storage:** Cloudflare R2

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker Desktop (for the local PostgreSQL database)

### Installation

1. **Start the database**  
   Make sure Docker is running, then spin up the Postgres container:
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Initialize the Database Schema**  
   Apply the Prisma schema to your local database:
   ```bash
   npx prisma migrate dev
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation
For detailed business logic and project specifications, refer to the `PRD.md` file in the root directory. For agent-specific coding rules, refer to `AGENTS.md`.
