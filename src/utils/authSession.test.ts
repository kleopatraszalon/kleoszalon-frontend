import {
  clearAuthenticatedSession,
  COOKIE_SESSION_MARKER,
  getLastActivityAt,
  hasStoredAuthToken,
  IDLE_TIMEOUT_MS,
  markAuthenticatedSession,
  markSessionActivity,
} from './authSession';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test('idle timeout follows the five minute VIR requirement', () => {
  expect(IDLE_TIMEOUT_MS).toBe(5 * 60 * 1000);
});

test('session activity is stored as a shared browser timestamp', () => {
  markSessionActivity(123456789);
  expect(getLastActivityAt()).toBe(123456789);
});

test('browser session stores only a non-secret compatibility marker', () => {
  markAuthenticatedSession();
  expect(localStorage.getItem('kleo_token')).toBe(COOKIE_SESSION_MARKER);
  expect(localStorage.getItem('token')).toBe(COOKIE_SESSION_MARKER);
  expect(hasStoredAuthToken()).toBe(true);
});

test('legacy readable JWT is replaced immediately by the cookie-session marker', () => {
  localStorage.setItem('kleo_token', 'eyJhbGciOiJIUzI1NiJ9.legacy.signature');
  expect(hasStoredAuthToken()).toBe(true);
  expect(localStorage.getItem('kleo_token')).toBe(COOKIE_SESSION_MARKER);
  expect(localStorage.getItem('token')).toBe(COOKIE_SESSION_MARKER);
});

test('logout clears authentication state without deleting unrelated UI preferences', () => {
  markAuthenticatedSession();
  localStorage.setItem('kleo_account_type', 'admin');
  localStorage.setItem('kleo.sidebar.collapsed', 'true');
  sessionStorage.setItem('kleo_token', 'session-token');
  sessionStorage.setItem('unrelated-feature-state', 'keep-me');

  clearAuthenticatedSession();

  expect(localStorage.getItem('kleo_token')).toBeNull();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('kleo_account_type')).toBeNull();
  expect(sessionStorage.getItem('kleo_token')).toBeNull();
  expect(localStorage.getItem('kleo.sidebar.collapsed')).toBe('true');
  expect(sessionStorage.getItem('unrelated-feature-state')).toBe('keep-me');
});
