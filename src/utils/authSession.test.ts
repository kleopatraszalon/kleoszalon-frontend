import {
  ADMIN_IDLE_LOCK_MS,
  clearAdminIdleActivity,
  clearAuthenticatedSession,
  getLastActivityAt,
  markSessionActivity,
} from './authSession';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test('admin idle lock follows the five minute VIR requirement', () => {
  expect(ADMIN_IDLE_LOCK_MS).toBe(5 * 60 * 1000);
});

test('admin activity is stored as a shared browser timestamp and can be removed for non-admin sessions', () => {
  markSessionActivity(123456789);
  expect(getLastActivityAt()).toBe(123456789);
  clearAdminIdleActivity();
  expect(getLastActivityAt()).toBeNull();
});

test('explicit logout clears authentication state without deleting unrelated UI preferences', () => {
  localStorage.setItem('kleo_token', 'secret-token');
  localStorage.setItem('kleo_account_type', 'admin');
  localStorage.setItem('kleo.sidebar.collapsed', 'true');
  sessionStorage.setItem('kleo_token', 'session-token');
  sessionStorage.setItem('unrelated-feature-state', 'keep-me');

  clearAuthenticatedSession();

  expect(localStorage.getItem('kleo_token')).toBeNull();
  expect(localStorage.getItem('kleo_account_type')).toBeNull();
  expect(sessionStorage.getItem('kleo_token')).toBeNull();
  expect(localStorage.getItem('kleo.sidebar.collapsed')).toBe('true');
  expect(sessionStorage.getItem('unrelated-feature-state')).toBe('keep-me');
});