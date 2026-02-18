import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders techno workstation', () => {
  render(<App />);
  const headingElement = screen.getByText(/TECHNO WORKSTATION/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders AI music generator', () => {
  render(<App />);
  const aiGeneratorElement = screen.getByText(/AI MUSIC GENERATOR/i);
  expect(aiGeneratorElement).toBeInTheDocument();
});

test('renders chord bank', () => {
  render(<App />);
  const chordBankElement = screen.getByText(/CHORD BANK/i);
  expect(chordBankElement).toBeInTheDocument();
});