import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../apis/client';
import { MenuManagerPage } from './MenuManagerPage';

vi.mock('../../apis/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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
      <MenuManagerPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: {
      data:
        url === '/admin/menus'
          ? [{ id: 1, location: 'HEADER' }]
          : [
              {
                id: 9,
                menuId: 1,
                label: 'Giới thiệu',
                url: '/gioi-thieu',
                linkType: 'INTERNAL',
                target: '_self',
                parentId: null,
                sortOrder: 0,
                isVisible: true,
              },
            ],
    },
  }));
});

afterEach(cleanup);

describe('MenuManagerPage dialog save', () => {
  it('names item actions and blocks duplicate submission and dismissal while saving', async () => {
    let resolveSave!: (value: { data: { data: object } }) => void;
    vi.mocked(api.put).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const edit = await screen.findByRole('button', { name: 'Chỉnh sửa mục menu Giới thiệu' });
    expect(screen.getByRole('button', { name: 'Xóa mục menu Giới thiệu' })).toBeInTheDocument();
    await user.click(edit);
    const dialog = screen.getByRole('dialog', { name: /Chỉnh sửa mục menu/i });
    const form = within(dialog)
      .getByRole('button', { name: /Lưu menu/i })
      .closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(api.put).toHaveBeenCalledOnce());

    await user.keyboard('{Escape}');
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.getByRole('dialog', { name: /Chỉnh sửa mục menu/i })).toBeInTheDocument();
    expect(api.put).toHaveBeenCalledOnce();

    resolveSave({ data: { data: {} } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
