# AAA Computer Services - Accounting Management System

A complete double-entry accounting system built for AAA Computer Services. Built with Next.js 16, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL (Neon).

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Seeding Sample Data](#seeding-sample-data)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Accounting Rules](#accounting-rules)
- [User Modes](#user-modes)
- [Vercel Deployment](#vercel-deployment)
- [Backup & Restore](#backup--restore)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)

## Overview

This is a fully functional Accounting Management System for AAA Computer Services. It implements double-entry bookkeeping with:

- **Chart of Accounts** - 17 accounts with classifications and balances
- **Journal Entries** - Multi-line entries with draft/post/reverse workflow
- **General Journal** - Chronological entry listing with filtering
- **General Ledger** - Per-account running balances from posted entries
- **Financial Reports** - Trial Balance, Income Statement, Balance Sheet
- **Adjusting Entries Practice** - Guided adjustment entry with dynamic calculations
- **Dashboard** - Real-time totals from the database
- **Settings & Data Management** - Seed and reset data

All monetary calculations use exact decimal arithmetic (no floating-point errors). All balances are calculated from posted journal entries - never stored separately.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma 5.22.0 |
| Database | PostgreSQL (Neon managed provider) |
| Authentication | Session-based (JWT in httpOnly cookie) |
| Monetary Math | decimal.js (exact decimal arithmetic) |
| Icons | lucide-react |
| Testing | Playwright (browser automation) |

## Prerequisites

- **Node.js** v18 or higher (v24 tested)
- **npm** v10 or higher
- **Git** (for version control)
- A **Neon account** (free tier at https://neon.tech) OR access to a PostgreSQL database
- **Windows** (tested on Windows 10/11 with PowerShell)

## Local Setup

### 1. Clone or Open the Project

The project is already in your folder: `C:\Users\USER\Downloads\AAA-Computer-Shop-Accounting`

### 2. Install Dependencies

```powershell
cd C:\Users\USER\Downloads\AAA-Computer-Shop-Accounting
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```powershell
copy .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string (Neon or local) |
| `NEXTAUTH_SECRET` | Random secret for session signing (min 16 chars) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local development |
| `ADMIN_EMAIL` | Initial admin email (default: admin@example.com) |
| `ADMIN_PASSWORD` | Initial admin password (change in production!) |

Generate a secret:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set Up the Database

You need a PostgreSQL database. The easiest option is **Neon** (free tier, works locally and on Vercel):

1. Create a free account at https://neon.tech
2. Create a new project
3. Copy the connection string (looks like: `postgres://user:password@host.neon.tech/dbname?sslmode=require`)
4. Paste it into `DATABASE_URL` in your `.env` file

**Important:** The cloud database requires an internet connection. The local application connects to the same cloud database - it does not work fully offline.

### 5. Initialize the Database Schema

```powershell
npx prisma db push
```

This creates all tables in your database based on the Prisma schema.

### 6. Seed Sample Data (Optional)

The application includes sample data based on the AAA Computer Services exercise (December 2024 transactions).

**Step 1: Create the Chart of Accounts**
```powershell
# Call the seed API (you need to be logged in as admin first)
# Or seed via the Settings page in the UI after logging in
```

**Step 2: Log in to the UI**
- Start the app: `npm run dev`
- Go to `http://localhost:3000/login`
- Login with: `admin@example.com` / (password from your .env `ADMIN_PASSWORD`)

**Step 3: Seed data via the UI**
- Go to Settings & Data Management
- Click "Seed Everything" to create accounts + sample transactions

Or seed via API:
```powershell
# First log in via the UI to get a session cookie, then:
# POST /api/seed with { "type": "all" }
```

### 7. Start the Application

```powershell
npm run dev
```

Open `http://localhost:3000` in your browser. You'll be redirected to the login page.

## Database Setup

### Using Neon (Recommended)

Neon is a serverless PostgreSQL provider with a free tier. It works both locally and on Vercel.

1. Sign up at https://neon.tech
2. Create a project named "aaa-accounting"
3. In the Neon dashboard, get your connection string
4. Add it to `.env` as `DATABASE_URL`
5. Run `npx prisma db push` to create tables
6. Run `npx prisma generate` to generate the Prisma client

**Connection string format:**
```
postgres://<user>:<password>@<hostname>.aws.neon.tech/<dbname>?sslmode=require
```

### Using Local PostgreSQL

If you install PostgreSQL locally:

1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create a database: `createdb accounting_db`
3. Set `DATABASE_URL="postgres://postgres:password@localhost:5432/accounting_db"` in `.env`
4. Run `npx prisma db push`

### Production Database (Vercel)

On Vercel, set the `DATABASE_URL` environment variable in your Vercel project settings to your production Neon database connection string. **Never use the same database for development and production.**

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push schema to database (development) |
| `npx prisma migrate deploy` | Deploy migrations (production) |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma studio` | Open Prisma database GUI |

## Features

### Dashboard
- Total cash balance, accounts receivable, total assets, liabilities, equity
- Total revenue, expenses, net income/loss
- Journal entry counts (posted vs draft)
- Unposted draft warnings
- All figures calculated from actual posted entries

### Chart of Accounts
- All 17 required accounts with correct numbers and classifications
- Current balances calculated from posted entries
- Add, edit accounts (admin only)
- Prevent deletion of accounts used by posted transactions

### Journal Entries
- Multi-line journal entry form
- Save as draft (doesn't affect reports)
- Post entry (validates debits = credits)
- Reverse posted entries (auditable, preserves history)
- Duplicate reference prevention

### General Journal
- All entries in chronological order
- Filter by date, account, status, type
- View entry details with all lines

### General Ledger
- Per-account running balances
- Derived from posted journal entries only
- Normal balance-aware calculations

### Financial Reports
- **Trial Balance** - Debits equal credits verification
- **Income Statement** - Revenue, expenses, net income/loss
- **Balance Sheet** - Assets = Liabilities + Equity verification

### Adjusting Entries Practice
Guided adjustment entry for all 6 adjustments:

- **A: Office Supplies Used** - Enter amount, calculates expense/credit
- **B: Depreciation** - Calculates from cost, salvage rate, useful life
- **C: Unearned Revenue** - Two options: earned amount or ending balance
- **D: Accrued Revenue** - Enter amount, date
- **E: Paid Salaries** - Expense vs payable settlement
- **F: Services for Cash** - Enter cash amount

Each adjustment shows:
- Plain-language explanation
- Dynamic calculation from your inputs
- Journal entry preview before posting
- Balance verification

### Beginner Mode (Default)
- Simple labels and explanations
- Context-sensitive debit/credit explanations
- Guided forms with clear next steps
- Balance preview before posting
- Plain-language error messages

### Experienced Mode
- Compact interface
- Fewer explanatory messages
- Direct access to all features
- Same accounting engine and database

## Accounting Rules

All of the following are enforced by the system:

1. **Every posted entry must balance** - Total debits = total credits
2. **Drafts don't affect reports** - Only posted entries update balances
3. **No silent corrections** - Imbalances are never auto-fixed
4. **No deletion of posted history** - Use reversal instead
5. **Unique reference numbers** - Prevents duplicate posting
6. **Balances calculated from journal lines** - Never stored separately
7. **PHP currency (₱)** - All amounts in Philippine Pesos
8. **Decimal-safe arithmetic** - No floating-point errors

### Normal Balances

| Classification | Normal Balance |
|---------------|---------------|
| Asset | Debit |
| Contra-Asset | Credit |
| Liability | Credit |
| Owner's Equity | Credit |
| Contra-Equity | Debit |
| Revenue | Credit |
| Expense | Debit |

## User Modes

Switch between modes using the toggle in the top-right corner:

- **Beginner Mode** (default): Simple labels, explanations, guided forms
- **Experienced Mode**: Compact interface, fewer explanations

Both modes use the same database, validation rules, and accounting engine. Switching modes does not change accounting results.

## Vercel Deployment

### 1. Push to GitHub

```powershell
git init
git add .
git commit -m "Initial commit"
# Create a repository on GitHub, then:
git remote add origin https://github.com/YOURUSER/aaa-accounting.git
git push -u origin main
```

**Never commit real credentials.** The `.env` file contains secrets and should NOT be committed. A `.env.example` is provided instead.

### 2. Deploy to Vercel

1. Go to https://vercel.com and connect your GitHub repository
2. Import the `AAA-Computer-Shop-Accounting` repository
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` = Your production Neon connection string
   - `NEXTAUTH_SECRET` = A strong random secret
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` = Initial admin credentials
4. Deploy

### 3. Production Database

Run migrations on your production database:
```powershell
npx prisma migrate deploy
```

This requires the `DATABASE_URL` to point to your production database.

### 4. Seed Production Data

After deployment, log in to your production app and seed data via Settings & Data Management.

## Backup & Restore

### Database Backup (Neon)

Neon provides automatic backups. You can also manually export:

```powershell
# Using pg_dump (if you have PostgreSQL client tools)
pg_dump $env:DATABASE_URL > backup_$(Get-Date -Format "yyyyMMdd").sql
```

### Database Restore

```powershell
psql $env:DATABASE_URL < backup_file.sql
```

### Application Data

All accounting data is in the database. The application code is in Git. To restore:
1. Redeploy the application from GitHub
2. Restore the database from backup
3. Seed data if needed via the UI

## Testing

### Browser-Based Testing

The project includes Playwright for end-to-end browser testing:

```powershell
npx playwright install
npx playwright test
```

### Manual Testing Checklist

- [ ] Login/logout works
- [ ] Dashboard shows correct totals from database
- [ ] Chart of Accounts shows all 17 accounts
- [ ] Can create and post a balanced journal entry
- [ ] Cannot post an unbalanced entry
- [ ] Draft entries don't affect reports
- [ ] Can reverse a posted entry
- [ ] Trial Balance debits = credits
- [ ] Balance Sheet assets = liabilities + equity
- [ ] All 6 adjusting entries work correctly
- [ ] Sample data can be seeded and reset
- [ ] Data persists after page refresh
- [ ] Data persists after server restart

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `DATABASE_URL not set` | Add your PostgreSQL connection string to `.env` |
| `Prisma client not generated` | Run `npx prisma generate` |
| `Database connection failed` | Check your Neon connection string and internet connection |
| `404 on pages` | Ensure you're running `npm run dev`, not opening HTML files directly |
| `Login fails` | Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`; ensure database is seeded |
| `Build fails` | Run `npm run build` and check TypeScript errors |

## Limitations

1. **Internet required for database** - The database is hosted on Neon (cloud). The application requires an internet connection to read/write accounting records. A local-only offline mode is not implemented.

2. **Single database for local and production** - You must use separate Neon databases for development and production. Do not share the same database.

3. **No multi-currency** - All amounts are in PHP (₱). Currency is configurable via settings but the system assumes one currency.

4. **No file attachments** - Journal entries cannot have attached documents.

5. **No recurring transactions** - Each entry must be created manually.

6. **No foreign exchange** - All transactions are in the base currency.

## Support

For issues with this accounting system:
1. Check the Troubleshooting section above
2. Verify your database connection is working
3. Check browser console for errors
4. Verify the Prisma schema matches your database (`npx prisma db push`)
