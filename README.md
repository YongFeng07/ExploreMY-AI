# ExploreMY AI 🇲🇾

<div align="center">

**Malaysia Intelligent Travel Operating System**

*One App, All of Malaysia — Maps + Transport + Food + Planning + Social*

[![CI](https://github.com/exploremy-ai/exploremy-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/exploremy-ai/exploremy-ai/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (for local PostgreSQL + Redis)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/exploremy-ai/exploremy-ai.git
cd exploremy-ai

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 4. Start local infrastructure
pnpm docker:dev

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start all apps in development mode
pnpm dev
```

The app will be available at:
- **Web:** http://localhost:3000
- **API:** http://localhost:3001

## 📁 Project Structure

See [STRUCTURE.md](./STRUCTURE.md) for the complete project tree.

```
ExploreMY-AI/
├── apps/
│   ├── web/          # Next.js 15 Frontend
│   └── api/          # NestJS Backend
├── packages/
│   ├── shared/       # Shared types, utils, validation
│   ├── database/     # Prisma schema + client
│   ├── config/       # Environment config
│   └── ui/           # Shared UI components
├── tooling/
│   ├── eslint/       # ESLint configs
│   └── typescript/   # TypeScript configs
├── docker/           # Docker Compose + Dockerfiles
├── .github/          # CI/CD workflows
└── docs/             # Documentation
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | NestJS, Node.js, TypeScript |
| **Database** | PostgreSQL 16 + PostGIS |
| **ORM** | Prisma |
| **Cache** | Redis (Upstash) |
| **Auth** | Clerk |
| **Maps** | Google Maps API |
| **AI** | OpenAI GPT-4o + Gemini 2.5 Flash |
| **Storage** | Supabase Storage |
| **Search** | Algolia |
| **Payments** | Stripe |
| **Analytics** | PostHog |
| **Deploy** | Vercel + Railway |

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Security Policy](./docs/SECURITY.md)

## 🔒 Security

- SOC 2 Type II ready
- OWASP Top 10 compliant
- PDPA (Malaysian Data Protection) compliant
- JWT + OAuth authentication
- RBAC with 7 role levels
- API rate limiting
- SQL injection prevention (Prisma parameterized queries)
- XSS + CSRF protection

## 📊 Performance Targets

- Lighthouse score > 95
- Page load < 2s
- API response < 200ms p95
- 99.95% uptime
- Support 500K MAU

## 📄 License

UNLICENSED — Proprietary. All rights reserved.

---

<div align="center">
  <sub>Built with ❤️ for Malaysia</sub>
</div>
