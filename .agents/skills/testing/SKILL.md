---
name: testing
description: Write and run tests with pytest and Playwright
---

# Testing

Test rules and conventions.

## Backend Tests

Framework: pytest
Fixtures in: tests/conftest.py

Existing fixtures:

- test_engine
- test_db
- mock_auth
- test_client

## Test Strategy

- Tests use SQLite in-memory
- Tables created for test session
- Each test runs in transaction rolled back after
- Reuse fixtures; don't invent parallel setup

## Rules

- New features need tests
- Bug fixes need regression tests
- Tests should be deterministic
- Avoid sleeps and external network deps
- Mock at the boundary

## Auth/Security Tests

When changing auth, cover unhappy paths:

- expired tokens
- invalid signatures
- missing claims
- insufficient role
- missing cookie/session
- unauthorized vs forbidden

## Frontend Tests

- E2E uses Playwright
- No unit-test framework established
- Don't introduce Vitest/Jest/React Query unless requested
