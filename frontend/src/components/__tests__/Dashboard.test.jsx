import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';

describe('Dashboard', () => {
  it('renderiza el dashboard principal', () => {
    render(<Dashboard />);
    expect(
      screen.getByText(/Welcome to BrainSafes/i)
    ).toBeInTheDocument();
  });
}); 