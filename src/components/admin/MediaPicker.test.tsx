import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
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

it('shows the safe API upload error without clearing the current image', async () => {
  vi.mocked(api.post).mockRejectedValue(new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    data: { message: 'Không thể tải ảnh lên dịch vụ lưu trữ. Vui lòng thử lại sau.' },
    status: 502, statusText: 'Bad Gateway', headers: {}, config: { headers: {} } as never,
  }));
  const onChange = vi.fn();
  const view = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <MediaPicker label="Logo" value="https://cdn.example.test/old.png" onChange={onChange} />
  </QueryClientProvider>);
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'new.png', { type: 'image/png' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải ảnh lên dịch vụ lưu trữ');
  expect(onChange).not.toHaveBeenCalled();
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.test/old.png');
});
