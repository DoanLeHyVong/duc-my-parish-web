import { Church, Globe2, Mail, MapPin, Phone, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParishProfile } from '../../types';

export function Footer({ profile }: { profile?: ParishProfile | null }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <Church />
            <div>
              <small>GIÁO PHẬN BÀ RỊA</small>
              <strong>GIÁO XỨ ĐỨC MỸ</strong>
            </div>
          </div>
          <p>{profile?.description || 'Hiệp nhất trong đức tin — Lan tỏa yêu thương.'}</p>
          <div className="socials">
            <a href={profile?.facebookUrl || '#'} aria-label="Facebook">
              <Globe2 />
            </a>
            <a href={profile?.youtubeUrl || '#'} aria-label="YouTube">
              <Play />
            </a>
          </div>
        </div>
        <div>
          <h3>Khám phá</h3>
          <Link to="/about">Giới thiệu</Link>
          <Link to="/mass-schedule">Giờ lễ</Link>
          <Link to="/events">Sự kiện</Link>
          <Link to="/gallery">Thư viện</Link>
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
          © {new Date().getFullYear()} Giáo xứ Đức Mỹ. Nội dung minh họa có thể chỉnh sửa trong quản
          trị.
        </div>
      </div>
    </footer>
  );
}
