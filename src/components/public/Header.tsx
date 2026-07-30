import { CalendarDays, MapPin, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { HomeData } from '../../types';

const fallbackNav = [
  ['Trang chủ', '/'],
  ['Giới thiệu', '/gioi-thieu'],
  ['Thông báo', '/chuyen-muc/thong-bao'],
  ['Giờ lễ', '/gio-le'],
  ['Lời Chúa', '/chuyen-muc/loi-chua-hang-ngay'],
  ['Tin tức', '/chuyen-muc/tin-giao-xu'],
  ['Thư viện', '/thu-vien'],
  ['Liên hệ', '/lien-he'],
];

export function Header({ data }: { data?: HomeData }) {
  const [open, setOpen] = useState(false);
  const nav = data?.menu?.items?.length
    ? data.menu.items.map((i) => [i.label, i.url || '/'])
    : fallbackNav;
  const date = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <header>
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
            <Link to="/tim-kiem" aria-label="Tìm kiếm"><Search /></Link>
            <button onClick={() => setOpen((v) => !v)} aria-label="Mở menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
    </header>
  );
}
