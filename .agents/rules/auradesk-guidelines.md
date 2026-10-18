# Agent Guidelines & Tech Stack

This file contains the strict technical rules and architecture for **Lumodesk** (the PFE platform). As an AI Agent, I MUST automatically load and follow these instructions for every task. *(For business logic, refer to `PRD.md`).*

## 1. Core Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui + next-themes
- **Database / ORM:** PostgreSQL (Docker) + Prisma v7
- **Authentication:** Better Auth
- **Media Storage:** Cloudflare R2
- **i18n:** `next-intl` (en/fr)

## 2. Coding Rules & Folder Structure
- **Keep Files Short:** Source files MUST be a **maximum of 200 lines**. *Exception:* You can surpass 200 lines by a little (but absolutely no more than 300 lines) ONLY if splitting makes the code structure ugly or overly complex.
- **Clean Code:** Use custom hooks and other abstraction techniques to keep the logic clean and maintainable.
- **Reusability:** Create reusable components whenever possible.
- **Do not over-split:** While modularity is key, avoid splitting components so granularly that the logic becomes hard to trace or results in unnecessary prop drilling for tiny, single-use elements. Find a pragmatic balance.
- **Modularity:** Extract reusable UI into `components/` and business logic into `services/` or `lib/`.
- **Language:** Use strict TypeScript.
- **Strict i18n:** NEVER hardcode user-facing text. Always use `next-intl`. Every UI string MUST be localized from day one.
- **Pre-flight:** Always verify `docker-compose.yml` is running before DB migrations. Consult `PRD.md` before starting massive features.

## 3. Multi-Tenant Architecture & Security
- **Data Isolation:** Every Prisma query in the private space MUST include a tenant check (e.g., `where: { photographerId: session.user.id }`) to prevent data leakage.
- **Role-Based Access Control (RBAC):** Strictly respect PRD roles (Admin, Photographe, Client, Equipe) for data access, Server Actions, and UI.

## 4. Next.js 16 Standards (App Router)
- **Server Components:** Default to React Server Components (RSC). Only use `"use client"` when interactivity or React hooks are required.
- **Server Actions:** Use Server Actions for ALL data mutations instead of `/api` routes to ensure type-safety.
- **Route Groups:** Strictly separate `app/(public)` (Marketing) from `app/(dashboard)` (CRM).
- **Images:** ALWAYS use the Next.js `<Image />` component from `next/image` instead of the standard `<img>` tag when possible, for automatic image optimization.

## 5. Data Validation & Authentication
- **Zod:** Use `zod` for ALL validation (client forms, Server Action payloads, env vars). NEVER trust client input without Zod.
- **better-auth:** Follow specific App Router patterns to securely fetch sessions on both server and client.

## 6. Prisma ORM v7
- **Strict Naming Conventions:** Database tables/columns MUST use `snake_case` (e.g., `user_profiles`). Prisma Client TS code MUST use `camelCase` (enforced via `@@map("table_name")` and `@map("column_name")`).
- **Relationships:** Schema MUST strictly follow the domain models outlined in the PRD.

## 7. Caching, Fetching & Performance
- **Dashboard SSR:** The dashboard MUST use Server Components (SSR) to securely fetch data from Prisma without exposing APIs.
- **Suspense & Streaming:** Always use `loading.tsx` and `<Suspense>` to stream the UI shell instantly while fetching private data.
- **Client Fetching:** Use `swr` ONLY for live polling/infinite scrolling. It must NOT be the default method.
- **Cache Invalidation:** Mutate via Server Actions + `revalidatePath` / `revalidateTag`.

## 8. Form Handling
- **React Hook Form:** For all client interactions, use `react-hook-form` paired with `@hookform/resolvers/zod`.
- **shadcn/ui:** Rely on the `shadcn/ui` `<Form>` components. Submit sanitized data to Server Actions.

## 9. UI/UX, Design System & Theming
- **Rich Aesthetics:** Implement premium designs. Favor glassmorphism, sleek dark modes, and curated palettes. Do not settle for basic MVPs.
- **Single Source of Truth:** NEVER scatter hardcoded padding, colors, or `rounded-3xl` utilities. Update CSS variables in `globals.css` or the specific `components/ui/` file to maintain a cohesive theme.
- **Icons:** Exclusively use `lucide-react`.

## 10. Translation Organization (next-intl)
- **File Location:** Strictly `en.json` and `fr.json` in `/messages/`.
- **Hierarchical Structure:** Group translations hierarchically by Feature or Component (e.g., `"Auth": { "loginButton": "Se connecter" }`). NEVER use flat keys.

## 11. Tooling, Formatting & Naming
- **Kebab Case Everything:** ALL files across the project MUST be named in `kebab-case.tsx` (e.g., `user-profile.tsx`), except Next.js reserved files.
- **Package Manager:** Exclusively use `pnpm`. NEVER use `npm` or `yarn`.
- **Formatter:** Use **Biome**. Run `pnpm format` routinely.
- **Always Lint:** You MUST always run the linter (`pnpm lint`) and formatter (`pnpm format`), and proactively fix any linting issues or warnings that arise from your code changes.

## 12. Animations & Interactions
- **Framer Motion:** Use for complex, fluid animations (scroll-reveals, layout transitions).
- **CSS Transitions:** Use standard Tailwind (`transition-all duration-300`) for simple hover states.
- **Aesthetic:** Keep animations smooth, subtle, and premium. NEVER overly bouncy.

## 13. Data Lists (Pagination & Filtering)
- **Always Paginate:** Any large data list (Clients, Invoices, Media) MUST implement pagination from day one. NEVER render massive unsorted arrays.
- **URL Search Params:** Store active filters, sort state, and current page in the URL (`?page=2&status=pending`) to keep UI in sync with the server.
- **Reorder + pagination:** Drag-and-drop reorders only the items on the current page. The server accepts a reorder only if it is a permutation of exactly those rows, reuses their existing positions as slots, and rejects anything else as stale. Do not use hard caps in place of pagination.

## 14. Fonts
- **Google only:** Load every font with `next/font/google`. Do not add local font files.

## 15. Demo & Placeholder Content
- **Real photos:** Demo sites use real, CC0-licensed photos stored in R2 under `demo/`. Never use generated colour blocks as placeholders.

## 16. Destructive Actions & Cleanup
- **Ask first:** Before deleting code, files or dependencies, ask. shadcn components are kept for theming even when unused.
- **Clean up:** Delete temporary files, scratch scripts and test accounts/data created during a task once it is finished.

## 17. Verification
- **Dev server:** Verify features against the running dev server on port 3000, not only a separate production build.
- **Restarts:** Say clearly when `pnpm dev` must be restarted (after a migration, `.env` or `next.config` change).

## 18. Public Sites (Theming, i18n, Caching)
- **Scoped themes:** Light/dark modes are scoped to the public site via `data-site-theme` and never follow the dashboard's theme.
- **Independent language:** The public site's language is chosen per visitor (`?lang`, cookie, browser, studio default), independent of the dashboard's.
- **Full translation:** Every visible string, including emails, exists in both `en` and `fr`.
- **One renderer:** The preview and the public site use the same renderer, so the preview always matches what visitors see.
- **Cache invalidation:** Public-site data is cached per photographer. Any server action that changes what a site shows must call `revalidatePublicSites()` (`updateTag`).

## 19. Tooling & Schema
- **Fix script:** `pnpm fix` runs format, lint and organize. Run it before committing.
- **Prisma config:** The config is `prisma.config.ts`. `postinstall` regenerates the Prisma client, so run `pnpm db:generate` after schema changes.
