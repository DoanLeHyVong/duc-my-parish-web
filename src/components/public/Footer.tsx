import { Church, Globe2, Mail, MapPin, Phone, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MenuItem, ParishProfile } from '../../types';

export function Footer({ profile, menu }: { profile?: ParishProfile | null; menu?: { items: MenuItem[] } | null }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <Church />
            <div>
              <small>{profile?.diocese || 'Giáo phận'}</small>
              <strong>{profile?.name || 'Giáo xứ'}</strong>
            </div>
          </div>
          <p>{profile?.footerText || profile?.description}</p>
          <div className="socials">
            {profile?.facebookUrl && <a href={profile.facebookUrl} aria-label="Facebook">
              <Globe2 />
            </a>}
            {profile?.youtubeUrl && <a href={profile.youtubeUrl} aria-label="YouTube">
              <Play />
            </a>}
          </div>
        </div>
        <div>
          <h3>Khám phá</h3>
          {menu?.items?.length ? menu.items.map((item) => item.url?.startsWith('https://')
            ? <a key={item.id} href={item.url} target={item.target === '_blank' ? '_blank' : undefined} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}>{item.label}</a>
            : <Link key={item.id} to={item.url?.startsWith('/') && !item.url.startsWith('//') ? item.url : '/'}>{item.label}</Link>) : <><Link to="/about">Giới thiệu</Link><Link to="/mass-schedule">Giờ lễ</Link><Link to="/events">Sự kiện</Link><Link to="/gallery">Thư viện</Link></>}
        </div>
        <div>
          <h3>Thông tin</h3>
          <Link to="/categories/parish-news">Tin giáo xứ</Link>
          <Link to="/categories/announcements">Thông báo</Link>
          <Link to="/categories/daily-word">Lời Chúa</Link>
          <Link to="/contact">Liên hệ</Link>
          <Link to="/privacy">Quyền riêng tư</Link>
          <Link to="/terms">Điều khoản sử dụng</Link>
          <Link to="/support">Hỗ trợ</Link>
          <Link to="/data-request">Yêu cầu dữ liệu</Link>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <p>
            <MapPin /> {profile?.address}
          </p>
          <p>
            <Phone /> {profile?.phone}
          </p>
          <p>
            <Mail /> {profile?.email}
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          {profile?.copyrightText || `© ${new Date().getFullYear()} ${profile?.name || 'Giáo xứ'}`}
        </div>
      </div>
    </footer>
  );
}
