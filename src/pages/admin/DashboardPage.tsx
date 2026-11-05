import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarDays, Eye, FileText, PenLine, ShieldCheck } from 'lucide-react';
import { api } from '../../apis/client';
import { useAuth } from '../../providers/auth-context';

export function DashboardPage() {
  const { user, can } = useAuth();
  const parish = can('parish.manage');
  const query = useQuery({
    queryKey: ['dashboard', parish],
    enabled: parish,
    queryFn: async () => {
      const [posts, announcements, events] = await Promise.all([
        api.get('/admin/posts?limit=100'),
        api.get('/admin/announcements?limit=100'),
        api.get('/admin/events?limit=100'),
      ]);
      return { posts: posts.data.data, announcements: announcements.data.data, events: events.data.data };
    },
  });
  const posts = query.data?.posts ?? [];
  const cards = parish ? [
    ['Tổng bài viết', posts.length, FileText],
    ['Bài đã đăng', posts.filter((post: any) => post.status === 'PUBLISHED').length, PenLine],
    ['Tổng lượt xem', posts.reduce((sum: number, post: any) => sum + post.viewCount, 0), Eye],
    ['Thông báo', query.data?.announcements.length ?? 0, Bell],
    ['Sự kiện', query.data?.events.length ?? 0, CalendarDays],
  ] as const : [];

  return <>
    <div className="admin-title"><div><span>QUẢN TRỊ HỢP NHẤT</span><h1>Tổng quan</h1><p>Quyền truy cập được hợp nhất từ các vai trò của tài khoản và luôn được kiểm tra lại ở máy chủ.</p></div></div>
    {parish && <div className="stat-grid">{cards.map(([label, value, Icon]) => <article key={label}><Icon /><div><strong>{value}</strong><span>{label}</span></div></article>)}</div>}
    <div className="admin-card role-summary"><ShieldCheck /><div><h2>Quyền đang hiệu lực</h2><p>{user?.roles.join(' · ')}</p><small>{user?.permissions.join(', ')}</small></div></div>
  </>;
}
