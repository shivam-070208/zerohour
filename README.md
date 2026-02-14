# ZeroHour - Community Sustainability Platform

A Next.js 15 application that helps residents and community leaders track, manage, and improve household and community-level sustainability metrics through AI-powered workflow recommendations.

##  Overview

**ZeroHour** is a comprehensive sustainability tracking platform where:
- **Residents** input household data (energy, water, waste, transportation) and view AI-generated personalized improvement plans
- **Community Leaders** manage members, approve/reject join requests, and view both individual and community-level sustainability workflows
- **Gemini AI** generates structured React Flow diagrams showing actionable steps to reduce environmental impact
- **Inngest** triggers async event processing whenever household data changes
- **Prisma** persists all data including generated recommendation workflows with nodes and edges

---

##  Folder Structure & Components

### `/src/app` - Next.js App Router Pages & API Routes

#### Layout Groups (Auth-Protected)

- **`(auth)/`** - Public auth pages - `login/page.js`, `sign-up/page.js`
- **`(resident)/`** - Resident-only routes - `resident/page.js`
- **`(leader)/`** - Leader-only routes - `leader/page.js`, `leader/members/page.js`, `leader/workflow/page.js`
- **`set-role/`** - Role selection - `set-role/page.js`

### `/src/app/api` - Backend API Routes

**Auth** - `auth/set-role` [POST]
**Community** - `community/create`, `communities`, `community/members`, `community/requests`, `leader-community`
**Resident Data** - `resident/household-data` [GET/POST], `user/request` [POST], `user/requests` [GET]
**Workflows** - `recommendation/[id]` [GET], `recommendation/search` [GET], `workflow/regenerate` [POST]
**Inngest** - `inngest` [GET/POST/PUT] for event processing

### `/src/app/recommendation/[id]` - React Flow Viewer

Interactive XYFlow workflow editor with:
- Draggable/selectable nodes (sustainability steps)
- Edges showing dependencies
- Pan, zoom, minimap controls
- Regenerate button to trigger new Gemini workflow

### `/src/components/ui/` - Reusable UI Components

Custom Tailwind CSS components (button, card, input, label, form, error, separator, bottom-gradient)

### `/src/lib/` - Shared Utilities

- `auth.js`, `auth-client.js`, `auth-utils.js` - Authentication
- `db.js` - Prisma client
- `gemini.js` - Google AI SDK wrapper with structured output
- `utils.js` - General utilities

### `/prisma/` - Database

- `schema.prisma` - Defines User, Community, Household, Recommendation, Node, Edge models
- `migrations/` - Database migration history

---

##  Route Map

**Public Routes:** `/` (redirect), `/login`, `/sign-up`
**Protected Routes:** `/set-role`, `/resident`, `/leader`, `/leader/members`, `/recommendation/[id]`

---

##  Data Flow

```
Resident fills household form (energy, water, waste, transport, commute, location)
   POST /api/resident/household-data
   Inngest events: event.generate.individual + event.generate.community
   Gemini API returns: { nodes: [...], edges: [...] }
   Prisma saves Recommendation + Nodes + Edges
   Leader views /recommendation/{id} with XYFlow
```

---

##  Technology Stack

**Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS 4, @xyflow/react
**Backend:** Prisma 7 ORM, PostgreSQL, Better Auth (email/OAuth)
**AI/Events:** Google Generative AI SDK (Gemini 2.0 Flash), Inngest
**UI:** Shadcn UI patterns, React Hook Form, Zod, Sonner, Lucide React

---

##  Getting Started

\`\`\`bash
npm install
# Create .env.local: DATABASE_URL, GEMINI_API_KEY, BETTER_AUTH_SECRET
npx prisma migrate dev
npm run dev
# Visit http://localhost:3000
\`\`\`

---

##  Testing

1. Sign up as COMMUNITY_LEADER  create community
2. Sign up as RESIDENT  request to join
3. Leader approves membership
4. Resident fills household data  Inngest triggers Gemini
5. Leader views workflow on `/recommendation/{id}` (XYFlow editor)

---

##  Gemini Integration

- Model: `gemini-2.0-flash`
- Temperature: 0.2 (deterministic)
- Structured output enforced at API level
- Response: Guaranteed JSON { nodes, edges }

---
**Built for sustainability impact. ZeroHour hackathon project 2026.**
