# New API Endpoints

Workflow for adding new API endpoints.

## Route Structure

Protected routes live in `api/routers/`. Follow existing structure.

## Auth Dependencies

Use the narrowest correct dependency:

- `require_curator` for curator-only endpoints
- `require_admin` for admin-only endpoints
- `get_current_user_from_cookie` for authenticated users

Don't create parallel auth patterns.

## Response Handling

Match existing response/error patterns in nearby routers.

## Roles

Valid roles: guest, pending, curator, admin
Don't invent new role names without instruction.

## Public vs Private

- Public endpoints: no auth required
- Update APIDocs.tsx for public endpoints
- Private/internal: docs only, not APIDocs.tsx
