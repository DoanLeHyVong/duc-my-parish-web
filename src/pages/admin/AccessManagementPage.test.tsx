import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../apis/client';
import { AccessManagementPage } from './AccessManagementPage';

let superAdmin = true;

vi.mock('../../apis/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock('../../providers/auth-context', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../providers/auth-context')>();
  return {
    ...original,
    useAuth: () => ({ hasRole: (role: string) => role === 'SUPER_ADMIN' && superAdmin }),
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const roles = [
  { code: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['security.manage'], userCount: 1 },
  { code: 'PARISH_ADMIN', name: 'Quản trị Giáo xứ', permissions: ['parish.manage'], userCount: 0 },
  { code: 'APPGLV_ADMIN', name: 'Quản trị AppGLV', permissions: ['appglv.manage'], userCount: 0 },
  { code: 'TEACHER', name: 'Giáo viên', permissions: ['appglv.teach'], userCount: 1 },
];
const users = [
  {
    id: 'root',
    username: 'root',
    displayName: 'Root Admin',
    isActive: true,
    roles: ['SUPER_ADMIN'],
  },
  {
    id: 'teacher',
    username: 'teacher',
    displayName: 'Teacher',
    isActive: true,
    roles: ['TEACHER'],
  },
];
type InvalidDraftOverride = {
  displayName?: string;
  email?: string;
  password?: string;
  chooseRole?: boolean;
};
const invalidDraftCases: Array<[string, InvalidDraftOverride, RegExp]> = [
  ['display name', { displayName: 'A' }, /Họ tên hiển thị/i],
  ['email format', { email: 'not-an-email' }, /Email chưa đúng định dạng/i],
  ['email length', { email: `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(59)}.com` }, /191/i],
  ['password minimum', { password: 'short' }, /12 đến 72 byte UTF-8/i],
  ['password UTF-8 maximum', { password: 'é'.repeat(37) }, /12 đến 72 byte UTF-8/i],
  ['missing role', { chooseRole: false }, /ít nhất một vai trò/i],
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={client}>
      <AccessManagementPage />
    </QueryClientProvider>,
  );
  return { client, invalidate, unmount: view.unmount };
}

beforeEach(() => {
  vi.clearAllMocks();
  superAdmin = true;
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: { data: url.endsWith('/users') ? users : roles },
  }));
  vi.mocked(api.post).mockResolvedValue({ data: { data: {} } });
  vi.mocked(api.put).mockResolvedValue({ data: { data: {} } });
});

afterEach(cleanup);

describe('AccessManagementPage managed account creation', () => {
  it('shows account creation only to Super Admins and never makes Super Admin editable', async () => {
    const user = userEvent.setup();
    const first = renderPage();
    expect(await screen.findByRole('button', { name: /Tạo tài khoản/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Chỉnh sửa vai trò/i })[0]!);
    const roleDialog = screen.getByRole('dialog', { name: /Root Admin/i });
    const superAdminCheckbox = within(roleDialog).getByRole('checkbox', {
      name: /Quản trị toàn hệ thống/i,
    });
    expect(superAdminCheckbox).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /Tạo tài khoản/i }));
    const dialog = screen.getByRole('dialog', { name: /Tạo tài khoản/i });
    expect(
      within(dialog).queryByRole('checkbox', { name: /Super Admin/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Họ tên hiển thị/i })).toHaveFocus();
    first.client.clear();
    first.unmount();

    superAdmin = false;
    renderPage();
    expect(await screen.findAllByText('Tài khoản & vai trò')).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: /Tạo tài khoản/i })).not.toBeInTheDocument();
  });

  it('copies current roles into an explicit editor and sends nothing until Save', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Teacher');
    await user.click(screen.getAllByRole('button', { name: /Chỉnh sửa vai trò/i })[1]!);
    let dialog = screen.getByRole('dialog', { name: /Teacher/i });
    expect(within(dialog).getByRole('checkbox', { name: /Giáo lý viên/i })).toBeChecked();
    const parishRole = within(dialog).getByRole('checkbox', {
      name: /Quản trị website giáo xứ/i,
    });
    expect(parishRole).not.toBeChecked();
    await user.click(parishRole);
    expect(api.put).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: /Hủy/i }));
    expect(api.put).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: /Chỉnh sửa vai trò/i })[1]!);
    dialog = screen.getByRole('dialog', { name: /Teacher/i });
    expect(
      within(dialog).getByRole('checkbox', { name: /Quản trị website giáo xứ/i }),
    ).not.toBeChecked();
    await user.click(within(dialog).getByRole('checkbox', { name: /Quản trị website giáo xứ/i }));
    await user.click(within(dialog).getByRole('button', { name: /Lưu vai trò/i }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/admin/security/users/teacher/roles', {
        roles: ['TEACHER', 'PARISH_ADMIN'],
      }),
    );
    expect(screen.queryByRole('dialog', { name: /Teacher/i })).not.toBeInTheDocument();
  });

  it('keeps the role editor open and the account summary unchanged after a failed save', async () => {
    vi.mocked(api.put).mockRejectedValueOnce({
      response: { data: { error: { message: 'Không thể cập nhật vai trò.' } } },
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Teacher');
    await user.click(screen.getAllByRole('button', { name: /Chỉnh sửa vai trò/i })[1]!);
    const dialog = screen.getByRole('dialog', { name: /Teacher/i });
    await user.click(within(dialog).getByRole('checkbox', { name: /Quản trị website giáo xứ/i }));
    await user.click(within(dialog).getByRole('button', { name: /Lưu vai trò/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không thể cập nhật');
    expect(screen.getByRole('dialog', { name: /Teacher/i })).toBeInTheDocument();
    const teacherCard = screen.getByText('Teacher').closest('article')!;
    expect(within(teacherCard).queryByText('Quản trị website giáo xứ')).not.toBeInTheDocument();
  });

  it('prevents Escape and backdrop dismissal while a role save is pending', async () => {
    let resolveUpdate!: (value: { data: { data: object } }) => void;
    vi.mocked(api.put).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Teacher');
    await user.click(screen.getAllByRole('button', { name: /Chỉnh sửa vai trò/i })[1]!);
    const dialog = screen.getByRole('dialog', { name: /Teacher/i });
    await user.click(within(dialog).getByRole('button', { name: /Lưu vai trò/i }));
    await waitFor(() => expect(api.put).toHaveBeenCalledOnce());

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: /Teacher/i })).toBeInTheDocument();
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.getByRole('dialog', { name: /Teacher/i })).toBeInTheDocument();

    resolveUpdate({ data: { data: {} } });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Teacher/i })).not.toBeInTheDocument(),
    );
  });

  it('submits normalized safe fields and multiple managed roles, clears the password, and invalidates the list', async () => {
    const user = userEvent.setup();
    const { invalidate } = renderPage();
    await user.click(await screen.findByRole('button', { name: /Tạo tài khoản/i }));

    await user.type(
      screen.getByRole('textbox', { name: /Họ tên hiển thị/i }),
      '  Nguyễn Quản Trị  ',
    );
    await user.type(screen.getByRole('textbox', { name: /Tên đăng nhập/i }), '  New.Admin  ');
    await user.type(screen.getByRole('textbox', { name: /Email/i }), '  NEW@EXAMPLE.COM  ');
    await user.type(screen.getByLabelText(/Mật khẩu ban đầu/i), 'initial-pass');
    await user.click(screen.getByRole('checkbox', { name: /Quản trị website giáo xứ/i }));
    await user.click(screen.getByRole('checkbox', { name: /Giáo lý viên/i }));
    await user.click(
      within(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).getByRole('button', {
        name: /^Tạo tài khoản$/i,
      }),
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/admin/security/users', {
        displayName: 'Nguyễn Quản Trị',
        username: 'new.admin',
        email: 'new@example.com',
        password: 'initial-pass',
        roles: ['PARISH_ADMIN', 'TEACHER'],
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['security-access'] });
    expect(screen.queryByRole('dialog', { name: /Tạo tài khoản/i })).not.toBeInTheDocument();
  });

  it('keeps safe fields retryable and clears the password after a recoverable API error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          error: { code: 'IDENTITY_CONFLICT', message: 'Tên đăng nhập hoặc email đã tồn tại.' },
        },
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Tạo tài khoản/i }));
    await user.type(screen.getByRole('textbox', { name: /Họ tên hiển thị/i }), 'Người Dùng Mới');
    await user.type(screen.getByRole('textbox', { name: /Tên đăng nhập/i }), 'new.user');
    await user.type(screen.getByLabelText(/Mật khẩu ban đầu/i), 'initial-pass');
    await user.click(screen.getByRole('checkbox', { name: /Giáo lý viên/i }));
    await user.click(
      within(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).getByRole('button', {
        name: /^Tạo tài khoản$/i,
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tên đăng nhập hoặc email đã tồn tại.',
    );
    expect(screen.getByRole('textbox', { name: /Họ tên hiển thị/i })).toHaveValue('Người Dùng Mới');
    expect(screen.getByRole('textbox', { name: /Tên đăng nhập/i })).toHaveValue('new.user');
    expect(screen.getByLabelText(/Mật khẩu ban đầu/i)).toHaveValue('');
  });

  it('uses shared safe dismissal behavior for account creation', async () => {
    const user = userEvent.setup();
    renderPage();
    const opener = await screen.findByRole('button', { name: /Tạo tài khoản/i });
    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /Tạo tài khoản/i })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    await user.click(opener);
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.queryByRole('dialog', { name: /Tạo tài khoản/i })).not.toBeInTheDocument();

    await user.click(opener);
    await user.click(
      within(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).getByRole('button', {
        name: /Hủy/i,
      }),
    );
    expect(screen.queryByRole('dialog', { name: /Tạo tài khoản/i })).not.toBeInTheDocument();
  });

  it('blocks invalid client input without a request and clears the attempted password', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Tạo tài khoản/i }));
    await user.type(screen.getByRole('textbox', { name: /Họ tên hiển thị/i }), 'Valid Name');
    await user.type(screen.getByRole('textbox', { name: /Tên đăng nhập/i }), 'invalid username');
    await user.type(screen.getByLabelText(/Mật khẩu ban đầu/i), 'initial-pass');
    await user.click(screen.getByRole('checkbox', { name: /Giáo lý viên/i }));
    await user.click(
      within(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).getByRole('button', {
        name: /^Tạo tài khoản$/i,
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Tên đăng nhập');
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Mật khẩu ban đầu/i)).toHaveValue('');
  });

  it.each(invalidDraftCases)(
    'blocks invalid %s without an API request and clears the password',
    async (_case, override, message) => {
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('button', { name: /Tạo tài khoản/i }));
      await user.type(
        screen.getByRole('textbox', { name: /Họ tên hiển thị/i }),
        override.displayName ?? 'Valid Name',
      );
      await user.type(screen.getByRole('textbox', { name: /Tên đăng nhập/i }), 'valid.user');
      if (override.email)
        await user.type(screen.getByRole('textbox', { name: /Email/i }), override.email);
      await user.type(
        screen.getByLabelText(/Mật khẩu ban đầu/i),
        override.password ?? 'initial-pass',
      );
      if (override.chooseRole !== false)
        await user.click(screen.getByRole('checkbox', { name: /Giáo lý viên/i }));
      await user.click(
        within(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).getByRole('button', {
          name: /^Tạo tài khoản$/i,
        }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(api.post).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/Mật khẩu ban đầu/i)).toHaveValue('');
    },
  );

  it('prevents closing or reopening the active dialog while creation is pending', async () => {
    let resolveCreate!: (value: { data: { data: object } }) => void;
    vi.mocked(api.post).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Tạo tài khoản/i }));
    await user.type(screen.getByRole('textbox', { name: /Họ tên hiển thị/i }), 'Pending User');
    await user.type(screen.getByRole('textbox', { name: /Tên đăng nhập/i }), 'pending.user');
    await user.type(screen.getByLabelText(/Mật khẩu ban đầu/i), 'initial-pass');
    await user.click(screen.getByRole('checkbox', { name: /Giáo lý viên/i }));
    const dialog = screen.getByRole('dialog', { name: /Tạo tài khoản/i });
    await user.click(within(dialog).getByRole('button', { name: /^Tạo tài khoản$/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledOnce());
    expect(within(dialog).getByRole('button', { name: /Đóng/i })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: /Hủy/i })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: /^Tạo tài khoản$/i })) {
      expect(button).toBeDisabled();
    }

    resolveCreate({ data: { data: {} } });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Tạo tài khoản/i })).not.toBeInTheDocument(),
    );
  });
});
