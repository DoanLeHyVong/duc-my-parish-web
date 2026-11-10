import {
  Album,
  Bell,
  BookOpen,
  CalendarDays,
  Church,
  Clock3,
  FileText,
  Home,
  Image,
  KeyRound,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Scale,
  Settings,
  Tags,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, type RoleCode } from '../providers/auth-context';

type LinkItem = { to: string; label: string; icon: ComponentType; permission?: string };
type LinkGroup = { label: string; links: LinkItem[] };
const mobileDrawerQuery = '(max-width: 860px)';
const drawerFocusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const linkGroups: LinkGroup[] = [
  { label: 'Tổng quan', links: [{ to: '/admin', label: 'Tổng quan', icon: LayoutDashboard }] },
  {
    label: 'Nội dung',
    links: [
      { to: '/admin/posts', label: 'Bài viết', icon: FileText, permission: 'parish.manage' },
      { to: '/admin/categories', label: 'Chuyên mục', icon: ListTree, permission: 'parish.manage' },
      { to: '/admin/tags', label: 'Thẻ nội dung', icon: Tags, permission: 'parish.manage' },
      { to: '/admin/media', label: 'Thư viện ảnh', icon: Image, permission: 'parish.manage' },
    ],
  },
  {
    label: 'Trang website',
    links: [
      { to: '/admin/banners', label: 'Banner', icon: Album, permission: 'parish.manage' },
      { to: '/admin/menus', label: 'Menu', icon: Menu, permission: 'parish.manage' },
      { to: '/admin/home-sections', label: 'Trang chủ', icon: Home, permission: 'parish.manage' },
      { to: '/admin/announcements', label: 'Thông báo', icon: Bell, permission: 'parish.manage' },
    ],
  },
  {
    label: 'Sinh hoạt giáo xứ',
    links: [
      { to: '/admin/mass-schedules', label: 'Giờ lễ', icon: Clock3, permission: 'parish.manage' },
      { to: '/admin/events', label: 'Sự kiện', icon: CalendarDays, permission: 'parish.manage' },
      { to: '/admin/albums', label: 'Album', icon: BookOpen, permission: 'parish.manage' },
    ],
  },
  {
    label: 'Hệ thống',
    links: [
      {
        to: '/admin/profile',
        label: 'Thông tin giáo xứ',
        icon: Church,
        permission: 'parish.manage',
      },
      { to: '/admin/settings', label: 'Cấu hình', icon: Settings, permission: 'parish.manage' },
      { to: '/admin/policies', label: 'Chính sách', icon: Scale, permission: 'policies.manage' },
      {
        to: '/admin/access',
        label: 'Tài khoản & vai trò',
        icon: KeyRound,
        permission: 'security.manage',
      },
    ],
  },
];

const roleNames: Partial<Record<RoleCode, string>> = {
  SUPER_ADMIN: 'Quản trị toàn hệ thống',
  PARISH_ADMIN: 'Quản trị website giáo xứ',
  APPGLV_ADMIN: 'Quản trị AppGLV',
  TEACHER: 'Giáo lý viên',
};

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(mobileDrawerQuery).matches : false,
  );
  const drawerRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const { user, admin, can, logout } = useAuth();
  const navigate = useNavigate();
  const visibleGroups = linkGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((group) => group.links.length);

  useEffect(() => {
    const media = window.matchMedia(mobileDrawerQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (!event.matches) setOpen(false);
    };
    setIsMobile(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>(drawerFocusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const controls = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(drawerFocusableSelector),
      );
      if (!controls.length) return;
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      const active = document.activeElement;
      const inside = active instanceof Node && drawerRef.current.contains(active);
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [isMobile, open]);

  return (
    <div className="admin-shell">
      {open && (
        <button
          className="admin-drawer-backdrop"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={drawerRef}
        id="admin-navigation"
        className={open ? 'open' : ''}
        aria-label="Điều hướng quản trị"
        aria-hidden={isMobile && !open ? true : undefined}
        inert={isMobile && !open ? true : undefined}
      >
        <div className="admin-brand">
          <span>✝</span>
          <div>
            <small>GIÁO XỨ</small>
            <strong>ĐỨC MỸ</strong>
          </div>
          <button type="button" aria-label="Đóng menu" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {visibleGroups.map((group) => (
            <section className="admin-nav-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.links.map(({ to, label, icon: Icon }) => (
                <NavLink end={to === '/admin'} key={to} to={to} onClick={() => setOpen(false)}>
                  <Icon aria-hidden="true" /> {label}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
        <button
          className="admin-logout"
          onClick={async () => {
            await logout();
            navigate('/admin/login');
          }}
        >
          <LogOut aria-hidden="true" /> Đăng xuất
        </button>
      </aside>
      <div className="admin-main">
        <header>
          <button
            ref={openerRef}
            type="button"
            aria-label="Mở menu"
            aria-controls="admin-navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <UserRound />
            <span>
              <small>{user?.roles.map((role) => roleNames[role] ?? role).join(' · ')}</small>
              <strong>{admin?.fullName ?? user?.displayName}</strong>
            </span>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
