import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { publicApi } from '../../apis/public.api';
import { PageSeo } from './SiteSeo';
import { SiteFavicon } from './SiteFavicon';

const parishFavicon = '/favicon.svg?v=parish-1';

vi.mock('../../apis/public.api', () => ({ publicApi: { profile: vi.fn() } }));
afterEach(() => { cleanup(); document.head.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach((link) => link.remove()); });

function GoAdmin() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/admin/access')}>Đến quản trị</button>;
}

it('updates page title, favicon and robots on navigation', async () => {
  vi.mocked(publicApi.profile).mockResolvedValue({
    name: 'Giáo xứ thử nghiệm', diocese: 'Giáo phận', description: 'Mô tả', address: '', faviconUrl: 'https://cdn.example.org/icon.png',
    pageSeo: { '/about': { title: 'Lịch sử cộng đoàn', description: 'Giới thiệu riêng' } },
  });
  render(<HelmetProvider><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/about']}><PageSeo /><GoAdmin /></MemoryRouter></QueryClientProvider></HelmetProvider>);
  await waitFor(() => expect(document.title).toContain('Lịch sử cộng đoàn – Giáo xứ thử nghiệm'));
  expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'Giới thiệu riêng');
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', 'https://cdn.example.org/icon.png');
  fireEvent.click(screen.getByRole('button', { name: 'Đến quản trị' }));
  await waitFor(() => expect(document.title).toContain('Tài khoản và vai trò – Quản trị'));
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

it('replaces the static icon, versions updates after profile invalidation and keeps one icon', async () => {
  document.head.insertAdjacentHTML('beforeend', '<link rel="shortcut icon" media="print" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/vite.svg">');
  vi.mocked(publicApi.profile).mockResolvedValue({ name: 'Giáo xứ Đức Mỹ', diocese: 'Giáo phận Bà Rịa', description: '', address: '', faviconUrl: 'https://cdn.example.org/icon.png?original=1', updatedAt: 'revision-1' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<HelmetProvider><QueryClientProvider client={client}><MemoryRouter><PageSeo /></MemoryRouter></QueryClientProvider></HelmetProvider>);
  await waitFor(() => expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', 'https://cdn.example.org/icon.png?original=1&parishIconRevision=revision-1'));
  expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(1);
  expect(document.querySelector('link[rel="icon"]')).not.toHaveAttribute('type');
  expect(document.querySelector('link[rel="icon"]')).not.toHaveAttribute('media');
  vi.mocked(publicApi.profile).mockResolvedValue({ name: 'Giáo xứ Đức Mỹ', diocese: 'Giáo phận Bà Rịa', description: '', address: '', faviconUrl: 'https://cdn.example.org/icon.png?original=1', updatedAt: 'revision-only' });
  await act(async () => { await client.invalidateQueries({ queryKey: ['profile'] }); });
  for (const rel of ['icon', 'apple-touch-icon']) {
    await waitFor(() => expect(document.querySelector(`link[rel="${rel}"]`)).toHaveAttribute('href', 'https://cdn.example.org/icon.png?original=1&parishIconRevision=revision-only'));
  }
  vi.mocked(publicApi.profile).mockResolvedValue({ name: 'Giáo xứ Đức Mỹ', diocese: 'Giáo phận Bà Rịa', description: '', address: '', faviconUrl: 'https://cdn.example.org/new.png', updatedAt: 'revision-2' });
  await act(async () => { await client.invalidateQueries({ queryKey: ['profile'] }); });
  await waitFor(() => expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', 'https://cdn.example.org/new.png?parishIconRevision=revision-2'));
  expect(document.querySelector('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'https://cdn.example.org/new.png?parishIconRevision=revision-2');
});

it('uses the parish fallback for missing, invalid or failed favicon images', () => {
  const { rerender } = render(<SiteFavicon />);
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', parishFavicon);
  rerender(<SiteFavicon url="javascript:alert(1)" />);
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', parishFavicon);
  rerender(<SiteFavicon url="https://cdn.example.org/missing.png" />);
  fireEvent.error(document.querySelector('link[rel="icon"]')!);
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', parishFavicon);
});

it('keeps fallback while the profile API fails', async () => {
  vi.mocked(publicApi.profile).mockRejectedValue(new Error('Profile unavailable'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<HelmetProvider><QueryClientProvider client={client}><MemoryRouter><PageSeo /></MemoryRouter></QueryClientProvider></HelmetProvider>);
  await waitFor(() => expect(client.getQueryState(['profile'])?.status).toBe('error'));
  expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', parishFavicon);
});

it('falls back when the image cannot decode and ignores errors from a previous URL', () => {
  const probes: { onerror: null | (() => void); src: string }[] = [];
  vi.stubGlobal('Image', class {
    onerror = null;
    src = '';
    constructor() { probes.push(this); }
  });
  try {
    const { rerender } = render(<SiteFavicon url="https://cdn.example.org/old.png" />);
    const staleError = probes[0].onerror!;
    rerender(<SiteFavicon url="https://cdn.example.org/new.png" />);
    staleError();
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', 'https://cdn.example.org/new.png');
    probes[1].onerror!();
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', parishFavicon);
    expect(document.querySelector('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/favicon-touch.png?v=parish-1');
  } finally { vi.unstubAllGlobals(); }
});
