import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { publicApi } from '../../apis/public.api';
import { PageSeo } from './SiteSeo';

vi.mock('../../apis/public.api', () => ({ publicApi: { profile: vi.fn() } }));

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
