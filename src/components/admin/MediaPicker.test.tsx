import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { api } from '../../apis/client';
import { MediaPicker } from './MediaPicker';

vi.mock('../../apis/client', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

it('selects an existing asset and uploads a new image through the API', async () => {
  const existing = { id: 1, secureUrl: 'https://cdn.example.test/old.png', originalName: 'old.png' };
  const uploaded = { id: 2, secureUrl: 'https://cdn.example.test/new.png', originalName: 'new.png' };
  vi.mocked(api.get).mockResolvedValue({ data: { data: [existing], meta: { totalPages: 2 } } });
  vi.mocked(api.post).mockResolvedValue({ data: { data: [uploaded] } });
  const onChange = vi.fn();
  const onSelect = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MediaPicker label="Logo" onChange={onChange} onSelect={onSelect} folder="branding" /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Chọn từ thư viện' }));
  expect(await screen.findByText('Trang 1/2')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/admin/media?page=1&limit=50');
  fireEvent.click(await screen.findByRole('button', { name: 'old.png' }));
  expect(onChange).toHaveBeenCalledWith(existing.secureUrl);
  const file = new File(['synthetic'], 'new.png', { type: 'image/png' });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(uploaded.secureUrl));
  expect(onSelect).toHaveBeenCalledWith(uploaded);
  expect(api.post).toHaveBeenCalledWith('/admin/media/upload', expect.any(FormData));
});
