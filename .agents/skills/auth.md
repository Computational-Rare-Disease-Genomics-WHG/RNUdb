# Authentication

Workflow for auth changes.

## Existing Dependencies

Use existing auth dependencies:

- `get_current_user_from_cookie`
- `require_curator`
- `require_admin`

## Security Rules

- Treat auth code as high-risk
- Never log tokens/secrets/credentials
- Never hardcode secrets
- Validate JWT claims explicitly

## New Env Vars

When adding auth-related env vars:

1. Add to `.env.example`
2. Update relevant docs
3. Ensure local/dev usage is clear

## Auth-Specific Error Handling

Distinguish between:

- expired token
- invalid token/signature
- missing required claims
- insufficient permissions

Don't collapse all auth failures into one broad catch.
