import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from '../Profile';

describe('Profile', () => {
  it('renderiza el perfil de usuario', () => {
    render(<Profile />);
    expect(
      screen.getByText(/perfil|profile|usuario|user/i)
    ).toBeInTheDocument();
  });
}); 