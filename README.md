# Rewisely

Rewisely is a personal study and productivity workspace centred on a simple loop: record a topic, schedule its next revision, complete it with a confidence score, and retain the full history.

## Included product surface

- Responsive dashboard with due, overdue, task and streak summaries
- Revision scheduling interface with a configurable 15-day default message
- Revision status and completion controls
- Month calendar with revision and task events
- Daily task checklist, priorities and categories
- Subjects, analytics, profile and settings views
- Password signup with email OTP verification, password sign-in, email-code sign-in, plus Google OAuth
- PostgreSQL Prisma schema covering users, settings, subjects, topics, revisions, tasks and notifications
- NestJS server bootstrap with global validation and safe CORS configuration

## Architecture

```text
client/    React + TypeScript + Vite user interface
server/    NestJS API bootstrap and Prisma data model
```

## Local setup

1. Install a current Node.js LTS distribution.
2. Copy `server/.env.example` to `server/.env` and provide a PostgreSQL/Neon connection string and a strong JWT secret.
3. Copy `client/.env.example` to `client/.env` if the API runs somewhere other than the default URL.
4. Run `npm install` at the project root.
5. Generate and migrate the database:

```bash
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
```

6. Start both apps with `npm run dev`.

The Vite client normally uses port 5173. The API is configured for port 5000.

## Environment variables

| Location | Variable | Purpose |
| --- | --- | --- |
| server | `DATABASE_URL` | PostgreSQL or Neon connection string |
| server | `JWT_SECRET` | JWT signing secret |
| server | `PORT` | API listening port |
| server | `CLIENT_URL` | Allowed browser origin(s) |
| server | `GMAIL_USER` | Gmail account used to send verification and login-code emails |
| server | `GMAIL_APP_PASSWORD` | Google App Password for Gmail SMTP (keep this secret) |
| server | `EMAIL_FROM` | Optional sender label/address; normally `Rewisely <same-gmail-address>` |
| client | `VITE_API_URL` | API base URL |

In local development, if Gmail credentials are unset, signup and email login codes are printed to the server terminal. Production requires `GMAIL_USER` and `GMAIL_APP_PASSWORD`. Codes expire after 10 minutes, can be used once, and are locked after five incorrect attempts; resend requests are limited to one per minute. Existing accounts are kept verified by the migration; new password accounts must verify before login, while Google sign-in uses Google's verified-email claim. Gmail SMTP requires 2-Step Verification and a Google App Password.

## Database model

`User` owns `UserSettings`, `Subject`, `Topic`, `Revision`, `Task`, and `Notification` records. Topics belong to subjects, and each topic retains independent revision records so completed and overdue history is never overwritten. Indexed date/status/ownership fields support dashboard and calendar range queries.

## Next backend implementation steps

The schema and server entrypoint are ready for the NestJS modules described in the brief. Add the auth, subject, topic, revision, task, dashboard, analytics and notification controllers/services before relying on the UI’s current in-memory demo state for production persistence. Then point the Axios/TanStack Query client at those endpoints.
