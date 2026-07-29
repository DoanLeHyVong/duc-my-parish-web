import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders section title and eyebrow', () => {
    render(<SectionHeading eyebrow="ĐỜI SỐNG GIÁO XỨ" title="Tin tức mới nhất" />);
    expect(screen.getByRole('heading', { name: 'Tin tức mới nhất' })).toBeInTheDocument();
    expect(screen.getByText('ĐỜI SỐNG GIÁO XỨ')).toBeInTheDocument();
  });
});
