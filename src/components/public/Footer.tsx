import { Church, Globe2, Mail, MapPin, Phone, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ParishProfile } from '../../types';

export function Footer({ profile }: { profile?: ParishProfile | null }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand"><Church /><div><small>GIÁO PHẬN BÀ RỊA</small><strong>GIÁO XỨ ĐỨC MỸ</strong></div></div>
          <p>{profile?.description || 'Hiệp nhất trong đức tin — Lan tỏa yêu thương.'}</p>
          <div className="socials"><a href={profile?.facebookUrl || '#'} aria-label="Facebook"><Globe2 /></a><a href={profile?.youtubeUrl || '#'} aria-label="YouTube"><Play /></a></div>
        </div>
        <div><h3>Khám phá</h3><Link to="/gioi-thieu">Giới thiệu</Link><Link to="/gio-le">Giờ lễ</Link><Link to="/su-kien">Sự kiện</Link><Link to="/thu-vien">Thư viện</Link></div>
        <div><h3>Thông tin</h3><Link to="/chuyen-muc/tin-giao-xu">Tin giáo xứ</Link><Link to="/chuyen-muc/thong-bao">Thông báo</Link><Link to="/chuyen-muc/loi-chua-hang-ngay">Lời Chúa</Link><Link to="/lien-he">Liên hệ</Link></div>
        <div><h3>Liên hệ</h3><p><MapPin /> {profile?.address}</p><p><Phone /> {profile?.phone}</p><p><Mail /> {profile?.email}</p></div>
      </div>
      <div className="footer-bottom"><div className="container">© {new Date().getFullYear()} Giáo xứ Đức Mỹ. Nội dung minh họa có thể chỉnh sửa trong quản trị.</div></div>
    </footer>
  );
}
