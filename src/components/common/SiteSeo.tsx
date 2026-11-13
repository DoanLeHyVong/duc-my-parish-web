import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { publicApi } from '../../apis/public.api';

const publicLabels: Record<string, string> = {
  '/': '', '/about': 'Giới thiệu', '/contact': 'Liên hệ', '/search': 'Tìm kiếm',
  '/mass-schedule': 'Giờ Thánh lễ', '/events': 'Sự kiện', '/gallery': 'Thư viện',
  '/privacy': 'Chính sách quyền riêng tư', '/terms': 'Điều khoản sử dụng',
  '/support': 'Hỗ trợ', '/data-request': 'Yêu cầu dữ liệu', '/404': 'Không tìm thấy trang',
};
const adminLabels: Record<string, string> = {
  '/admin': 'Tổng quan', '/admin/posts': 'Bài viết', '/admin/categories': 'Chuyên mục',
  '/admin/tags': 'Thẻ nội dung', '/admin/media': 'Thư viện ảnh', '/admin/banners': 'Banner',
  '/admin/menus': 'Menu', '/admin/home-sections': 'Trang chủ', '/admin/announcements': 'Thông báo',
  '/admin/mass-schedules': 'Giờ lễ', '/admin/events': 'Sự kiện', '/admin/albums': 'Album',
  '/admin/profile': 'Cấu hình website', '/admin/settings': 'Cấu hình', '/admin/policies': 'Chính sách',
  '/admin/access': 'Tài khoản và vai trò', '/admin/login': 'Đăng nhập quản trị',
};

export function PageSeo({ title, description, image, noindex }: { title?: string; description?: string; image?: string; noindex?: boolean }) {
  const { pathname } = useLocation();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: publicApi.profile, staleTime: 60_000 });
  const parish = profile?.name || 'Giáo xứ';
  const admin = pathname.startsWith('/admin');
  const pageSetting = profile?.pageSeo?.[pathname];
  const routeTitle = adminLabels[pathname] ?? (pathname.startsWith('/admin/posts/') ? 'Chỉnh sửa bài viết' : undefined)
    ?? publicLabels[pathname] ?? (pathname.startsWith('/posts/') ? 'Bài viết' : pathname.startsWith('/categories/') ? 'Chuyên mục' : pathname.startsWith('/events/') ? 'Sự kiện' : 'Không tìm thấy trang');
  const fullTitle = (pageSetting?.title && !admin ? `${pageSetting.title} – ${parish}` : title) || (admin ? `${routeTitle} – Quản trị ${parish}` : routeTitle ? `${routeTitle} – ${parish}` : profile?.seoTitle || `${parish}${profile?.diocese ? ` – ${profile.diocese}` : ''}`);
  const summary = pageSetting?.description || description || profile?.seoDescription || profile?.description || `Thông tin từ ${parish}`;
  const origin = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
  const canonical = `${origin}${pathname}`;
  const shareImage = image || pageSetting?.image || profile?.ogImageUrl || profile?.heroUrl;
  return <Helmet key={pathname}>
    <title>{fullTitle}</title>
    <meta name="description" content={summary} />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content={pathname.startsWith('/posts/') ? 'article' : 'website'} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={summary} />
    <meta property="og:url" content={canonical} />
    {shareImage && <meta property="og:image" content={shareImage} />}
    <meta name="twitter:card" content={shareImage ? 'summary_large_image' : 'summary'} />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={summary} />
    <meta name="robots" content={noindex || admin || pathname === '/search' || pathname === '/404' ? 'noindex,nofollow' : 'index,follow'} />
    <link rel="icon" href={profile?.faviconUrl || '/favicon.svg'} />
  </Helmet>;
}
