# Authentication Issue - Sign Out Auto-Re-login

## Problem Description
After clicking "Sign Out", if the user clicks "Sign In" again, they are automatically re-authenticated via GitHub OAuth without being prompted for credentials. This happens on subsequent visits to the login page as well.

## Root Cause Analysis

### The OAuth Flow
1. User clicks "Sign In" → redirected to `/api/auth/github`
2. GitHub OAuth callback sets JWT cookie at `/api/auth/callback`
3. User is authenticated

### The Sign Out Flow
1. User clicks "Sign Out" → calls `POST /api/auth/logout`
2. Server clears the JWT cookie via `clear_jwt_cookie(response)`
3. Client sets user state to null and redirects to home page

### The Issue
Looking at `src/context/AuthContext.tsx` lines 56-62:

```typescript
const logout = async () => {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  setUser(null);
  window.location.href = '/';  // Immediate redirect
};
```

The problem is:
1. The `fetch` to `/api/auth/logout` is asynchronous
2. The code immediately redirects via `window.location.href = '/'` before the logout request completes
3. If the page navigates before the cookie is cleared server-side, the browser may still have the old cookie

Additionally, GitHub OAuth may have a session or cookie of its own that persists, causing automatic re-authentication on subsequent visits.

## Backend Code (Working Correctly)

In `api/routers/auth.py`:
```python
@router.post("/logout")
async def auth_logout(response: Response):
    """Clear the session cookie."""
    clear_jwt_cookie(response)
    return {"message": "Logged out"}
```

The `clear_jwt_cookie` function properly deletes the cookie. The backend logout itself works correctly.

## Possible Solutions

### Solution 1: Await logout before redirect (Recommended for now)
Wait for the logout request to complete before redirecting:

```typescript
const logout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.error('Logout failed:', e);
  }
  setUser(null);
  // Clear any client-side state
  sessionStorage.clear();
  localStorage.clear();
  // Force a hard reload to clear all state
  window.location.replace('/');
};
```

### Solution 2: Clear GitHub OAuth state
Add a check before initiating OAuth login to clear any pending OAuth state:

```typescript
const login = () => {
  // Clear any OAuth state before starting new flow
  sessionStorage.removeItem('oauth_state');
  window.location.href = '/api/auth/github';
};
```

### Solution 3: Add CSRF token validation
The current OAuth flow uses a state parameter for CSRF protection, but this could be improved by:
- Storing state in sessionStorage instead of in-memory
- Validating state on callback before processing

## Current Status
This issue is documented but not yet fixed. The recommended approach is to:
1. Wait for logout request completion before redirect
2. Use `window.location.replace('/')` for a hard navigation
3. Consider clearing browser session state

## Files Involved
- `src/context/AuthContext.tsx` - Frontend auth context
- `api/routers/auth.py` - Backend auth routes
