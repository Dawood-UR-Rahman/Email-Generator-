# TempMail - Temporary Email Service

## Overview

TempMail is a full-stack temporary/disposable email service that allows users to generate instant email addresses for privacy protection. The platform supports both public users (no registration required) and authenticated users with additional features like custom domains. Key capabilities include auto-syncing inbox, IMAP/SMTP email integration, admin panel for system management, and a modern responsive UI with dark mode support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: React Context API for auth and email state, TanStack Query for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Fonts**: Inter (UI) and JetBrains Mono (technical content/email addresses)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES Modules
- **API Design**: RESTful endpoints under `/api` prefix
- **Authentication**: JWT-based auth with Bearer tokens, middleware for protected routes
- **Background Jobs**: node-cron for scheduled tasks (email fetching, cleanup)

### Data Storage
- **Primary Database**: MongoDB with Mongoose ODM
- **Schema Location**: `server/models/index.ts` contains all Mongoose schemas
- **Note**: The project includes Drizzle config for PostgreSQL but the actual implementation uses MongoDB. The `shared/schema.ts` contains Zod validation schemas and TypeScript interfaces.

### Key Data Models
- **User**: Authentication, roles (user/admin), verification tokens
- **Domain**: System and custom domains with verification status
- **Mailbox**: Temporary email addresses with expiration
- **Message**: Received emails with attachments
- **ImapSettings/SmtpSettings**: Email server configurations
- **BlogPost, PageContent, AdSnippet**: CMS functionality
- **AppSettings**: Global application configuration

### Email System
- **Receiving**: IMAP client for fetching emails from configured mail server
- **Sending**: Nodemailer with SMTP for outbound emails (verification, password reset)
- **Parsing**: mailparser for processing incoming email content
- **Auto-sync**: Client polls every 8-10 seconds, server cron runs every 30 seconds

### Authentication Flow
- JWT tokens stored in localStorage
- Auth context provides login/register/logout functions
- Protected routes use `authMiddleware` and `adminMiddleware`
- Optional auth available for public endpoints that benefit from user context

### Build System
- Development: Vite dev server with HMR
- Production: Custom build script using esbuild for server bundling, Vite for client
- Output: `dist/` directory with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### Email Services
- **IMAP**: Configured via admin panel, stored in `ImapSettings` collection
- **SMTP**: Configured via admin panel, stored in `SmtpSettings` collection
- Both require valid mail server credentials to be operational

### Database
- **MongoDB**: Connection via `MONGODB_URI` environment variable
- Default fallback: `mongodb://localhost:27017/tempmail`

### Environment Variables Required
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: JWT signing secret (falls back to default if not set)
- `DATABASE_URL`: PostgreSQL URL (for Drizzle, though MongoDB is primary)

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod validation
- **Dates**: date-fns for time formatting
- **Email**: nodemailer (SMTP), imap (IMAP client), mailparser
- **Scheduling**: node-cron for background jobs