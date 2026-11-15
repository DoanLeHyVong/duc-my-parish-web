import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { api } from '../../apis/client';

vi.mock('../../apis/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('../../components/admin/MediaPicker', () => ({ MediaPicker: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('shows the creation form when a fresh test database has no parish profile', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><ProfilePage /></QueryClientProvider>);
  expect(await screen.findByRole('heading', { name: 'Cấu hình website' })).toBeInTheDocument();
  expect(screen.getByLabelText('Tên giáo xứ')).toHaveValue('');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('creates a profile with the branding fields from an empty form', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 8 } } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><ProfilePage /></QueryClientProvider>);
  const tagline = await screen.findByLabelText('Khẩu hiệu');
  fireEvent.change(screen.getByLabelText('Tên giáo xứ'), { target: { value: 'Synthetic parish' } });
  fireEvent.change(screen.getByLabelText('Giáo phận'), { target: { value: 'Synthetic diocese' } });
  fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: 'Synthetic address' } });
  fireEvent.change(screen.getByLabelText('Giới thiệu giáo xứ'), { target: { value: 'Synthetic description' } });
  fireEvent.change(tagline, { target: { value: 'Synthetic tagline' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình website' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/parish-profile', expect.objectContaining({ tagline: 'Synthetic tagline' })));
});

it('sends the branding and SEO payload while preserving edits after a failed save', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [{
    id: 7, name: 'Synthetic parish', diocese: 'Synthetic diocese', description: 'Synthetic description',
    address: 'Synthetic address', logoUrl: 'https://cdn.example.test/logo.png',
    faviconUrl: 'https://cdn.example.test/favicon.png', heroUrl: 'https://cdn.example.test/hero.png',
    ogImageUrl: 'https://cdn.example.test/social.png', pageSeo: { '/about': { title: 'About', description: 'About description' } },
  }] } });
  vi.mocked(api.put).mockRejectedValue(new Error('Synthetic save failure'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><ProfilePage /></QueryClientProvider>);
  const tagline = await screen.findByLabelText('Khẩu hiệu');
  fireEvent.change(tagline, { target: { value: 'Edited tagline' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình website' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/parish-profile/7', expect.objectContaining({
    tagline: 'Edited tagline',
    logoUrl: 'https://cdn.example.test/logo.png',
    faviconUrl: 'https://cdn.example.test/favicon.png',
    heroUrl: 'https://cdn.example.test/hero.png',
    ogImageUrl: 'https://cdn.example.test/social.png',
    pageSeo: expect.objectContaining({ '/about': expect.objectContaining({ title: 'About' }) }),
  })));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu cấu hình website' })).toBeEnabled());
  expect(tagline).toHaveValue('Edited tagline');
});
