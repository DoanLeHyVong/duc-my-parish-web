import { Album, Bell, BookOpen, CalendarDays, Church, Clock3, FileText, Home, Image, KeyRound, LayoutDashboard, ListTree, LogOut, Menu, Scale, Settings, Tags, UserRound, X } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth-context';

type LinkItem = { to: string; label: string; icon: ComponentType; permission?: string };
const links: LinkItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/posts', label: 'Bài viết', icon: FileText, permission: 'parish.manage' },
  { to: '/admin/categories', label: 'Chuyên mục', icon: ListTree, permission: 'parish.manage' },
  { to: '/admin/tags', label: 'Thẻ nội dung', icon: Tags, permission: 'parish.manage' },
  { to: '/admin/media', label: 'Thư viện ảnh', icon: Image, permission: 'parish.manage' },
  { to: '/admin/banners', label: 'Banner', icon: Album, permission: 'parish.manage' },
  { to: '/admin/menus', label: 'Menu', icon: Menu, permission: 'parish.manage' },
  { to: '/admin/home-sections', label: 'Trang chủ', icon: Home, permission: 'parish.manage' },
  { to: '/admin/announcements', label: 'Thông báo', icon: Bell, permission: 'parish.manage' },
  { to: '/admin/mass-schedules', label: 'Giờ lễ', icon: Clock3, permission: 'parish.manage' },
  { to: '/admin/events', label: 'Sự kiện', icon: CalendarDays, permission: 'parish.manage' },
  { to: '/admin/albums', label: 'Album', icon: BookOpen, permission: 'parish.manage' },
  { to: '/admin/profile', label: 'Thông tin giáo xứ', icon: Church, permission: 'parish.manage' },
  { to: '/admin/settings', label: 'Cấu hình', icon: Settings, permission: 'parish.manage' },
  { to: '/admin/policies', label: 'Chính sách', icon: Scale, permission: 'policies.manage' },
  { to: '/admin/access', label: 'Tài khoản & vai trò', icon: KeyRound, permission: 'security.manage' },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, admin, can, logout } = useAuth();
  const navigate = useNavigate();
  const visible = links.filter((item) => !item.permission || can(item.permission));
  return <div className="admin-shell">
    <aside className={open ? 'open' : ''}>
      <div className="admin-brand"><span>✝</span><div><small>GIÁO XỨ</small><strong>ĐỨC MỸ</strong></div><button aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav>{visible.map(({ to, label, icon: Icon }) => <NavLink end={to === '/admin'} key={to} to={to} onClick={() => setOpen(false)}><Icon /> {label}</NavLink>)}</nav>
      <button className="admin-logout" onClick={async () => { await logout(); navigate('/admin/login'); }}><LogOut /> Đăng xuất</button>
    </aside>
    <div className="admin-main"><header><button aria-label="Mở menu" onClick={() => setOpen(true)}><Menu /></button><div><UserRound /><span><small>{user?.roles.join(' · ')}</small><strong>{admin?.fullName ?? user?.displayName}</strong></span></div></header><main><Outlet /></main></div>
  </div>;
}
