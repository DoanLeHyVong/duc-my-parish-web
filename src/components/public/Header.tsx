import { CalendarDays, MapPin, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { HomeData } from '../../types';

const fallbackNav = [
  ['Trang chủ', '/'],
  ['Giới thiệu', '/about'],
  ['Thông báo', '/categories/announcements'],
  ['Giờ lễ', '/mass-schedule'],
  ['Lời Chúa', '/categories/daily-word'],
  ['Tin tức', '/categories/parish-news'],
  ['Thư viện', '/gallery'],
  ['Liên hệ', '/contact'],
];

const legacyPublicPaths: Record<string, string> = {
  '/gioi-thieu': '/about',
  '/gio-le': '/mass-schedule',
  '/su-kien': '/events',
  '/thu-vien': '/gallery',
  '/lien-he': '/contact',
  '/tim-kiem': '/search',
  '/quyen-rieng-tu': '/privacy',
  '/dieu-khoan-su-dung': '/terms',
  '/ho-tro': '/support',
  '/yeu-cau-du-lieu': '/data-request',
  '/privacy.html': '/privacy',
  '/terms.html': '/terms',
  '/support.html': '/support',
  '/data-request.html': '/data-request',
};

function canonicalMenuUrl(url: string) {
  const [, path = url, suffix = ''] = url.match(/^([^?#]*)(.*)$/) || [];
  const staticPath = legacyPublicPaths[path];
  if (staticPath) return `${staticPath}${suffix}`;
  if (path.startsWith('/bai-viet/') && path.length > '/bai-viet/'.length) {
    return `/posts/${path.slice('/bai-viet/'.length)}${suffix}`;
  }
  if (path.startsWith('/chuyen-muc/') && path.length > '/chuyen-muc/'.length) {
    return `/categories/${path.slice('/chuyen-muc/'.length)}${suffix}`;
  }
  return url;
}

export function Header({ data }: { data?: HomeData }) {
  const [open, setOpen] = useState(false);
  const nav = data?.menu?.items?.length
    ? data.menu.items.map((i) => [i.label, canonicalMenuUrl(i.url || '/')])
    : fallbackNav;
  const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <header id="menu-trang-chu">
      <div className="topbar">
        <div className="container topbar-inner">
          <span><MapPin size={14} /> {data?.profile?.address || 'Giáo xứ Đức Mỹ — Giáo phận Bà Rịa'}</span>
          <span className="topbar-cross" aria-hidden="true">✣</span>
          <span><CalendarDays size={14} /> {date}</span>
        </div>
      </div>
      <div className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label="Giáo xứ Đức Mỹ">
            {data?.profile?.logoUrl ? <img src={data.profile.logoUrl} alt="Logo Giáo xứ Đức Mỹ" /> : <span className="parish-seal"><i>GIÁO XỨ ĐỨC MỸ</i><b>✝</b><em>ĐM</em><small>GIÁO PHẬN BÀ RỊA</small></span>}
            <span className="brand-title"><strong>GIÁO XỨ ĐỨC MỸ</strong></span>
          </Link>
          <nav className={open ? 'open' : ''}>
            {nav.map(([label, url]) => <NavLink key={`${label}-${url}`} to={url!} onClick={() => setOpen(false)}>{label}</NavLink>)}
          </nav>
          <div className="nav-actions">
            <Link to="/search" aria-label="Tìm kiếm"><Search /></Link>
            <button onClick={() => setOpen((v) => !v)} aria-label="Mở menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
    </header>
  );
}
