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
  if (!url.startsWith('/') && !url.startsWith('https://')) return '/';
  if (url.startsWith('//')) return '/';
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
    ? data.menu.items.map((item) => ({ ...item, url: canonicalMenuUrl(item.url || '/') }))
    : fallbackNav.map(([label, url], id) => ({ id, label, url, target: '_self' }));
  const navLink = (item: typeof nav[number]) => item.url.startsWith('https://')
    ? <a href={item.url} target={item.target === '_blank' ? '_blank' : undefined} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} onClick={() => setOpen(false)}>{item.label}</a>
    : <NavLink to={item.url} onClick={() => setOpen(false)}>{item.label}</NavLink>;
  const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <header id="menu-trang-chu">
      <div className="topbar">
        <div className="container topbar-inner">
          <span><MapPin size={14} /> {data?.profile?.address || data?.profile?.name || 'Giáo xứ'}</span>
          <span className="topbar-cross" aria-hidden="true">✣</span>
          <span><CalendarDays size={14} /> {date}</span>
        </div>
      </div>
      <div className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label={data?.profile?.name || 'Trang chủ'}>
            {data?.profile?.logoUrl ? <img src={data.profile.logoUrl} alt={`Logo ${data.profile.name}`} /> : <span className="parish-seal" aria-hidden="true"><b>✝</b></span>}
            <span className="brand-title"><strong>{data?.profile?.name || 'Giáo xứ'}</strong></span>
          </Link>
          <nav className={open ? 'open' : ''}>
            {nav.filter((item) => !('parentId' in item) || !item.parentId).map((item) => {
              const children = nav.filter((child) => 'parentId' in child && child.parentId === item.id);
              return <div key={item.id} className="nav-group">{navLink(item)}{children.length > 0 && <div className="nav-submenu">{children.map((child) => <div key={child.id}>{navLink(child)}</div>)}</div>}</div>;
            })}
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
