import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import vercelConfig from '../vercel.json';
import App from './App';

vi.mock('./layouts/PublicLayout', () => ({ PublicLayout: () => <Outlet /> }));
vi.mock('./pages/public/PolicyPage', () => ({ PolicyPage: ({ slug }: { slug: string }) => <div>{slug}</div> }));

describe('legacy policy routes', () => {
  it.each([
    ['/privacy.html', 'privacy-policy'],
    ['/terms.html', 'terms-of-use'],
    ['/support.html', 'support'],
    ['/data-request.html', 'data-request'],
  ])('redirects %s to its policy', async (path, slug) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
    expect(await screen.findByText(slug)).toBeInTheDocument();
  });

  it('declares the exact permanent deployment redirects', () => {
    expect(vercelConfig.redirects).toEqual([
      { source: '/privacy.html', destination: '/quyen-rieng-tu', permanent: true },
      { source: '/terms.html', destination: '/dieu-khoan-su-dung', permanent: true },
      { source: '/support.html', destination: '/ho-tro', permanent: true },
      { source: '/data-request.html', destination: '/yeu-cau-du-lieu', permanent: true },
    ]);
  });
});
