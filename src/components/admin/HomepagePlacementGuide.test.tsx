import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { HomepagePlacementGuide } from './HomepagePlacementGuide';

it('opens the canonical search path from tag placement guidance', () => {
  render(<HomepagePlacementGuide resource="tags" />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/search');
});
