import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

test('explains the five minute automatic logout when returning from an idle session', () => {
  render(
    <MemoryRouter initialEntries={['/login?reason=idle']}>
      <Login />
    </MemoryRouter>
  );

  expect(
    screen.getByText(/5 perc tétlenség után automatikusan kijelentkeztettünk/i)
  ).toBeInTheDocument();
});
