import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the application shell', async () => {
  render(<App />);

  // The root route redirects an unauthenticated browser to the lazy-loaded
  // login page. Await the user-visible form instead of asserting a transient
  // Suspense fallback that may resolve before the synchronous assertion runs.
  expect(await screen.findByRole('textbox')).toBeInTheDocument();
});
