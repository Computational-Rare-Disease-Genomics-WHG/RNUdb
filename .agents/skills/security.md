# Security

Security rules.

## Rules

- Never log tokens, secrets, credentials
- Never hardcode secrets
- New env vars added to `.env.example` + docs

## Existing Env Vars

- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- JWT_SECRET_KEY
- ADMIN_GITHUB_LOGINS
- FRONTEND_URL

## Auth Code

Treat auth code as high-risk.

- Validate JWT claims explicitly
- Don't disable security checks
