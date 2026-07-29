import { Album, Bell, BookOpen, CalendarDays, Church, Clock3, FileText, Home, Image, LayoutDashboard, ListTree, LogOut, Menu, Settings, ShieldCheck, Tags, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth-context';

const links = [
  ['/admin', 'Tổng quan', LayoutDashboard],
  ['/admin/posts', 'Bài viết', FileText],
  ['/admin/categories', 'Chuyên mục', ListTree],
  ['/admin/tags', 'Thẻ nội dung', Tags],
  ['/admin/media', 'Thư viện ảnh', Image],
  ['/admin/banners', 'Banner', Album],
  ['/admin/menus', 'Menu', Menu],
  ['/admin/home-sections', 'Trang chủ', Home],
  ['/admin/announcements', 'Thông báo', Bell],
  ['/admin/mass-schedules', 'Giờ lễ', Clock3],
  ['/admin/events', 'Sự kiện', CalendarDays],
  ['/admin/albums', 'Album', BookOpen],
  ['/admin/profile', 'Thông tin giáo xứ', Church],
  ['/admin/settings', 'Cấu hình', Settings],
  ['/admin/audit-logs', 'Nhật ký', ShieldCheck],
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  return <div className="admin-shell"><aside className={open ? 'open' : ''}><div className="admin-brand"><span>✝</span><div><small>GIÁO XỨ</small><strong>ĐỨC MỸ</strong></div><button onClick={() => setOpen(false)}><X /></button></div><nav>{links.map(([to, label, Icon]) => <NavLink end={to === '/admin'} key={to} to={to} onClick={() => setOpen(false)}><Icon /> {label}</NavLink>)}</nav><button className="admin-logout" onClick={async () => { await logout(); navigate('/admin/login'); }}><LogOut /> Đăng xuất</button></aside><div className="admin-main"><header><button onClick={() => setOpen(true)}><Menu /></button><div><UserRound /><span><small>Quản trị viên</small><strong>{admin?.fullName}</strong></span></div></header><main><Outlet /></main></div></div>;
}
