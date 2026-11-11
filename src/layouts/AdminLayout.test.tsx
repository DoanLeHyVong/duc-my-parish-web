import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, type AuthValue } from '../providers/auth-context';
import { AdminLayout } from './AdminLayout';

let mobile = false;
const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();

beforeEach(() => {
  mobile = false;
  mediaListeners.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: mobile,
      media: '(max-width: 860px)',
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        mediaListeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        mediaListeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

const auth: AuthValue = {
  user: {
    id: 'root',
    username: 'root',
    displayName: 'Quản trị viên',
    isActive: true,
    roles: ['SUPER_ADMIN'],
    permissions: ['parish.manage', 'policies.manage', 'security.manage'],
  },
  admin: null,
  ready: true,
  can: (permission) => ['parish.manage', 'policies.manage', 'security.manage'].includes(permission),
  hasRole: (role) => role === 'SUPER_ADMIN',
  login: vi.fn(),
  logout: vi.fn(),
};

function renderLayout(value: AuthValue = auth) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<p>Nội dung quản trị</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function resizeToDesktop() {
  mobile = false;
  const event = { matches: false, media: '(max-width: 860px)' } as MediaQueryListEvent;
  mediaListeners.forEach((listener) => listener(event));
}

describe('AdminLayout', () => {
  it('groups navigation and presents roles in plain Vietnamese', () => {
    renderLayout();
    expect(screen.getByRole('heading', { name: 'Nội dung' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trang website' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sinh hoạt giáo xứ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hệ thống' })).toBeInTheDocument();
    expect(screen.getByText('Quản trị toàn hệ thống')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tài khoản & vai trò/i })).toBeInTheDocument();
  });

  it('filters links by permission and removes groups with no visible destinations', () => {
    const restricted: AuthValue = {
      ...auth,
      user: { ...auth.user!, permissions: ['security.manage'] },
      can: (permission) => permission === 'security.manage',
    };
    renderLayout(restricted);
    expect(screen.getByRole('link', { name: /Tài khoản & vai trò/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Bài viết/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nội dung' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trang website' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sinh hoạt giáo xứ' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hệ thống' })).toBeInTheDocument();
  });

  it('hides the closed mobile drawer, traps focus, dismisses it, and restores the opener', async () => {
    mobile = true;
    const user = userEvent.setup();
    renderLayout();
    const opener = screen.getByRole('button', { name: 'Mở menu' });
    const drawer = document.querySelector('#admin-navigation') as HTMLElement;
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
    expect(drawer).toHaveAttribute('inert');

    await user.click(opener);
    expect(drawer).not.toHaveAttribute('aria-hidden');
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    const drawerClose = within(drawer).getByRole('button', { name: 'Đóng menu' });
    expect(drawerClose).toHaveFocus();
    screen.getByRole('button', { name: 'Đăng xuất' }).focus();
    await user.tab();
    expect(drawerClose).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(opener).toHaveAttribute('aria-expanded', 'false');
    expect(opener).toHaveFocus();
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' });

    await user.click(opener);
    await user.click(document.querySelector('.admin-drawer-backdrop') as HTMLButtonElement);
    expect(opener).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes an open drawer and releases scroll lock when resizing to desktop', async () => {
    mobile = true;
    const user = userEvent.setup();
    renderLayout();
    const opener = screen.getByRole('button', { name: 'Mở menu' });
    await user.click(opener);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    resizeToDesktop();
    await waitFor(() => expect(opener).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(document.body).not.toHaveStyle({ overflow: 'hidden' }));
    expect(document.querySelector('#admin-navigation')).not.toHaveAttribute('aria-hidden');
  });
});
