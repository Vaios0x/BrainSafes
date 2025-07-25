import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Landing from '../Landing';

describe('Landing', () => {
  it('renderiza el título principal', () => {
    render(<Landing />);
    expect(
      screen.getByText(/BrainSafes/i)
    ).toBeInTheDocument();
  });
}); 