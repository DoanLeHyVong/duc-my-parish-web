import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { api } from '../../apis/client';

vi.mock('../../apis/client', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
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
