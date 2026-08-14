import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageProvider';
import Login from './Login';

test('explains the five minute automatic logout when returning from an idle session', () => {
  localStorage.setItem('kleo_language', 'hu');
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/login?reason=idle']}>
        <Login />
      </MemoryRouter>
    </LanguageProvider>
  );

  expect(
    screen.getByText(/5 perc tétlenség után automatikusan kijelentkeztettünk/i)
  ).toBeInTheDocument();
});
