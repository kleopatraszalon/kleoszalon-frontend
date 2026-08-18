import {
  clearAuthenticatedSession,
  getLastActivityAt,
  IDLE_TIMEOUT_MS,
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

test('logout clears authentication state without deleting unrelated UI preferences', () => {
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
