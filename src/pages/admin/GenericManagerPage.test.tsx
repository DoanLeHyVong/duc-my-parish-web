import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../apis/client';
import { GenericManagerPage } from './GenericManagerPage';

vi.mock('../../apis/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../components/admin/HomepagePlacementGuide', () => ({
  HomepagePlacementGuide: () => null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <GenericManagerPage resource="categories" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({
    data: { data: [{ id: 7, name: 'Tin giáo xứ', slug: 'tin-giao-xu', isActive: true }] },
  });
});

afterEach(cleanup);

it('preserves Vietnamese category names and existing public slugs', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [{ id: 8, name: 'Phụng vụ', slug: 'pha-ng-va', isActive: true }] } });
  renderPage();
  expect(await screen.findByText('Phụng vụ')).toBeInTheDocument();
  expect(screen.getByText('pha-ng-va')).toBeInTheDocument();
  vi.mocked(api.put).mockResolvedValue({ data: { data: {} } });
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa Phụng vụ' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(/Tên/), { target: { value: 'Phụng vụ đã kiểm tra' } });
  fireEvent.submit(within(dialog).getByRole('button', { name: /Lưu thay đổi/i }).closest('form')!);
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/categories/8', expect.objectContaining({ name: 'Phụng vụ đã kiểm tra', slug: 'pha-ng-va' })));
});

describe('GenericManagerPage dialog save', () => {
  it('names item actions and blocks duplicate submission and dismissal while saving', async () => {
    let resolveSave!: (value: { data: { data: object } }) => void;
    vi.mocked(api.put).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const edit = await screen.findByRole('button', { name: 'Chỉnh sửa Tin giáo xứ' });
    expect(screen.getByRole('button', { name: 'Xóa Tin giáo xứ' })).toBeInTheDocument();
    await user.click(edit);
    const dialog = screen.getByRole('dialog', { name: /Chỉnh sửa Chuyên mục/i });
    const form = within(dialog)
      .getByRole('button', { name: /Lưu thay đổi/i })
      .closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(api.put).toHaveBeenCalledOnce());

    await user.keyboard('{Escape}');
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.getByRole('dialog', { name: /Chỉnh sửa Chuyên mục/i })).toBeInTheDocument();
    expect(api.put).toHaveBeenCalledOnce();

    resolveSave({ data: { data: {} } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
