import { type Page, type Route } from '@playwright/test';

export interface MockUser {
  github_login: string;
  name: string;
  email: string;
  role: 'guest' | 'pending' | 'curator' | 'admin';
  avatar_url?: string;
}

const mockUsers: Record<string, MockUser> = {
  curator: {
    github_login: 'test-curator',
    name: 'Test Curator',
    email: 'curator@test.com',
    role: 'curator',
    avatar_url: 'https://github.com/ghost.png',
  },
  admin: {
    github_login: 'test-admin',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    avatar_url: 'https://github.com/ghost.png',
  },
  pending: {
    github_login: 'test-pending',
    name: 'Test Pending',
    email: 'pending@test.com',
    role: 'pending',
    avatar_url: 'https://github.com/ghost.png',
  },
  guest: {
    github_login: 'test-guest',
    name: 'Test Guest',
    email: 'guest@test.com',
    role: 'guest',
    avatar_url: 'https://github.com/ghost.png',
  },
};

function createAuthHandler(page: Page, user: MockUser) {
  page.route('/api/auth/me', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}

export function mockCuratorAuth(page: Page) {
  createAuthHandler(page, mockUsers.curator);
}

export function mockAdminAuth(page: Page) {
  createAuthHandler(page, mockUsers.admin);
}

export function mockPendingAuth(page: Page) {
  createAuthHandler(page, mockUsers.pending);
}

export function mockGuestAuth(page: Page) {
  createAuthHandler(page, mockUsers.guest);
}

export function mockNoAuth(page: Page) {
  page.route('/api/auth/me', (route: Route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Not authenticated' }),
    });
  });
}

export function clearAuthMock(page: Page) {
  page.unroute('/api/auth/me');
}
