import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarDays, Eye, FileText, PenLine } from 'lucide-react';
import { api } from '../../apis/client';

export function DashboardPage() {
  const q = useQuery({ queryKey: ['dashboard'], queryFn: async () => {
    const [posts, announcements, events, audits] = await Promise.all([
      api.get('/admin/posts?limit=100'), api.get('/admin/announcements?limit=100'), api.get('/admin/events?limit=100'), api.get('/admin/audit-logs?limit=8'),
    ]);
    return { posts: posts.data.data, announcements: announcements.data.data, events: events.data.data, audits: audits.data.data };
  }});
  const posts = q.data?.posts || [];
  const cards = [
    ['Tổng bài viết', posts.length, FileText],
    ['Bài đã đăng', posts.filter((p: any) => p.status === 'PUBLISHED').length, PenLine],
    ['Tổng lượt xem', posts.reduce((sum: number, p: any) => sum + p.viewCount, 0), Eye],
    ['Thông báo', q.data?.announcements.length || 0, Bell],
    ['Sự kiện', q.data?.events.length || 0, CalendarDays],
  ] as const;
  return <><div className="admin-title"><div><span>QUẢN TRỊ NỘI DUNG</span><h1>Tổng quan</h1><p>Chào mừng trở lại. Đây là tình hình nội dung Giáo xứ Đức Mỹ.</p></div></div><div className="stat-grid">{cards.map(([label, value, Icon]) => <article key={label}><Icon /><div><strong>{value}</strong><span>{label}</span></div></article>)}</div><div className="admin-card"><div className="card-title"><h2><Activity /> Hoạt động gần đây</h2></div><div className="audit-list">{q.data?.audits.map((a: any) => <div key={a.id}><span>✦</span><p><b>{a.action}</b><small>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(a.createdAt))}</small></p></div>)}{!q.data?.audits.length && <p>Chưa có hoạt động.</p>}</div></div></>;
}
