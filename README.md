# UrbanrisePro

> Your trusted neighborhood service board — connecting residents with verified local service providers in Tier 2/3 Tamil Nadu towns.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-urbanrisepro.replit.app-orange)](https://local-pro-hub.replit.app)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20PostgreSQL-blue)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

---

## 📖 Overview

UrbanrisePro is a hyperlocal services marketplace built for Tier 2/3 towns in Tamil Nadu. It bridges the gap between residents who need everyday services (electricians, plumbers, home cleaners) and local providers who offer them — with trust, transparency, and local language support at the center.

The platform supports **three user roles**:

| Role | What they do |
|------|-------------|
| 🏠 **Resident** | Browse providers, book services, track bookings, leave reviews, raise disputes |
| 🔧 **Provider** | Complete KYC onboarding, accept/decline jobs, access upskilling modules, earn Hall of Fame badges |
| 🛡️ **Admin** | Verify provider KYC documents, resolve disputes, manage local partners, view metrics |

---

## ✨ Features

### For Residents
- 📱 Mobile-first UI with English / தமிழ் language toggle
- 🔍 Browse providers by service category (Electrician, Plumber, Home Cleaning, and more)
- 📅 Multi-step booking wizard with date/time selection and estimated pricing
- 📋 Booking status tracking (requested → accepted → completed)
- ⭐ Leave reviews and ratings after service completion
- ⚠️ Raise disputes for unresolved issues

### For Providers
- 🪪 KYC onboarding with ID document and selfie upload
- 📲 OTP-based phone login (no passwords)
- 📦 Dashboard to view and manage incoming bookings
- 🎓 Upskilling modules to improve professional skills
- 🏆 Hall of Fame — top-rated providers and residents recognized publicly
- 🤝 Referral points system for platform growth

### For Admins
- ✅ KYC verification queue — approve or reject provider documents
- ⚖️ Dispute resolution center
- 🏪 Local Partners directory management
- 📊 Metrics dashboard — registrations, bookings, onboarding funnel, referral stats

---

## 🛠 Tech Stack

### Frontend (`artifacts/localpro`)
| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | UI framework |
| Vite 7 | Build tool & dev server |
| Wouter | Client-side routing |
| TanStack Query | Server state & caching |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component library |
| i18next | English / Tamil localisation |

### Backend (`artifacts/api-server`)
| Technology | Purpose |
|------------|---------|
| Node.js 24 + TypeScript | Runtime |
| Express 5 | HTTP framework |
| PostgreSQL | Primary database |
| Drizzle ORM | Type-safe DB queries & migrations |
| express-session + connect-pg-simple | Server-side sessions stored in Postgres |
| Multer | File uploads (ID docs, selfies) |
| Pino | Structured logging |
| Zod | Runtime validation |

### Shared Libraries (`lib/`)
| Package | Purpose |
|---------|---------|
| `@workspace/api-spec` | OpenAPI 3.0 source of truth (`openapi.yaml`) |
| `@workspace/api-client-react` | Auto-generated TanStack Query hooks (via Orval) |
| `@workspace/api-zod` | Auto-generated Zod schemas (via Orval) |
| `@workspace/db` | Drizzle schema, migrations, seed data |

---

## 🗂 Project Structure

```
urbanrisepro/
├── artifacts/
│   ├── localpro/               # React + Vite web frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── resident/   # Home, provider profile, booking wizard, bookings list
│   │       │   ├── provider/   # Dashboard, onboarding, bookings, upskilling, profile
│   │       │   ├── admin/      # Metrics, KYC verify, disputes, partners
│   │       │   └── public/     # Hall of Fame, Local Partners
│   │       └── components/     # Shell, AuthProvider, BottomNav, LanguageToggle
│   └── api-server/             # Express API server
│       └── src/
│           ├── routes/         # Auth, providers, bookings, reviews, disputes, admin
│           ├── db/             # Schema, seed data
│           └── lib/            # Logger, session helpers
└── lib/
    ├── api-spec/               # openapi.yaml — edit here, then run codegen
    ├── api-client-react/       # Generated TanStack Query hooks
    ├── api-zod/                # Generated Zod schemas
    └── db/                     # Drizzle ORM schema & migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/archiesrakhi87-art/Local-Pro-Hub.git
cd Local-Pro-Hub
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file or set these in your environment:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/urbanrisepro
SESSION_SECRET=your-random-session-secret
ADMIN_SECRET=your-admin-login-secret
```

### 4. Push the database schema
```bash
pnpm --filter @workspace/db run push
```

### 5. Start the API server
```bash
pnpm --filter @workspace/api-server run dev
```

### 6. Start the frontend (in a separate terminal)
```bash
pnpm --filter @workspace/localpro run dev
```

The app will be available at `http://localhost:24209`.

---

## 👤 Default Accounts (Development)

The database is seeded with demo data on first run.

| Role | Phone | OTP |
|------|-------|-----|
| Resident | Any seeded number | Any 6-digit code |
| Provider | Any seeded number | Any 6-digit code |
| Admin | `9000000000` | Uses `ADMIN_SECRET` env var |

> **Note:** OTP verification is stubbed for the MVP — any 6-digit code is accepted. Real SMS integration is planned (see roadmap).

---

## 🔧 Development Commands

```bash
# Run full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API hooks and Zod schemas from openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only — does NOT run on production)
pnpm --filter @workspace/db run push
```

---

## 🌐 API Overview

The REST API is defined in `lib/api-spec/openapi.yaml`. Key endpoint groups:

| Group | Base Path | Description |
|-------|-----------|-------------|
| Auth | `/api/auth` | OTP login, admin login, session, logout |
| Providers | `/api/providers` | List, profile, onboarding, KYC upload |
| Bookings | `/api/bookings` | Create, list, update status |
| Reviews | `/api/reviews` | Post and fetch reviews |
| Disputes | `/api/disputes` | Raise and manage disputes |
| Admin | `/api/admin` | Metrics, KYC queue, dispute resolution |
| Engagement | `/api/engagement` | Hall of Fame, upskilling, referrals |
| Partners | `/api/partners` | Local Partners directory |

---

## 🗺 Roadmap

| # | Feature | Status |
|---|---------|--------|
| ✅ | Core booking flow (browse → book → track) | Done |
| ✅ | Provider KYC onboarding & admin verification | Done |
| ✅ | Hall of Fame & upskilling modules | Done |
| ✅ | Disputes & reviews | Done |
| ✅ | Admin metrics dashboard | Done |
| ✅ | English / Tamil localisation | Done |
| 🔄 | Persistent file storage across server restarts | Planned |
| 🔄 | Real SMS OTP (replace stub) | Planned |
| 🔄 | Native mobile app (Expo / React Native) | Planned |
| 🔄 | Booking status live refresh (polling/websocket) | Planned |
| 🔄 | Rejected provider resubmission flow | Planned |
| 🔄 | Resident profile page | Planned |
| 🔄 | Share provider profile (deep link) | Planned |

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ for Tier 2/3 Tamil Nadu communities</p>
