import { ArrowUpRight, Bell, CalendarDays, Clock3, Eye, Image, LayoutGrid, Menu, Newspaper, Search, Settings } from 'lucide-react';

type Props = {
  resource: string;
  sample?: Record<string, any>;
  compact?: boolean;
};

const guides: Record<string, { title: string; description: string; href: string; icon: typeof Eye }> = {
  posts: {
    title: 'Thẻ bài viết ngoài trang chủ',
    description: 'Bài đã xuất bản sẽ xuất hiện trong Tin tức mới nhất và section theo chuyên mục đã chọn.',
    href: '/#tin-tuc-moi-nhat',
    icon: Newspaper,
  },
  categories: {
    title: 'Nhãn chuyên mục trên bài viết',
    description: 'Tên chuyên mục xuất hiện trên ảnh bài viết và quyết định bài được đưa vào section nào.',
    href: '/#tin-tuc-moi-nhat',
    icon: Newspaper,
  },
  tags: {
    title: 'Thẻ dùng để phân loại bài',
    description: 'Tag hỗ trợ tìm kiếm và phân loại; không chiếm một khối riêng trên trang chủ.',
    href: '/tim-kiem',
    icon: Search,
  },
  banners: {
    title: 'Banner lớn đầu trang',
    description: 'Banner đang bật hiển thị ngay dưới menu chính, là vùng hình ảnh lớn đầu tiên khách nhìn thấy.',
    href: '/#banner-trang-chu',
    icon: Image,
  },
  'home-sections': {
    title: 'Khối nội dung trên trang chủ',
    description: 'Tiêu đề, thứ tự, kiểu trình bày và số bài của section được áp dụng cho các khối nội dung bên dưới.',
    href: '/#noi-dung-trang-chu',
    icon: LayoutGrid,
  },
  announcements: {
    title: 'Thông báo mới nhất',
    description: 'Thông báo được ghim xuất hiện ở card nổi dưới banner và trong khối Thông báo giáo xứ.',
    href: '/#thong-bao-trang-chu',
    icon: Bell,
  },
  'mass-schedules': {
    title: 'Card Thánh lễ hôm nay',
    description: 'Giờ lễ đúng ngày hiện tại xuất hiện trong card nổi ngay dưới banner.',
    href: '/#gio-le-hom-nay',
    icon: Clock3,
  },
  events: {
    title: 'Sự kiện và lịch sinh hoạt',
    description: 'Sự kiện sắp tới xuất hiện trong khối nền xanh ở phần dưới trang chủ.',
    href: '/#su-kien-trang-chu',
    icon: CalendarDays,
  },
  albums: {
    title: 'Album hình ảnh',
    description: 'Album đã xuất bản xuất hiện dưới dạng slider ảnh ở gần cuối trang chủ.',
    href: '/#album-trang-chu',
    icon: Image,
  },
  menus: {
    title: 'Thanh menu đầu trang',
    description: 'Các mục đang bật xuất hiện cạnh tên Giáo xứ ở đầu mọi trang.',
    href: '/#menu-trang-chu',
    icon: Menu,
  },
  'parish-profile': {
    title: 'Thông tin dùng toàn website',
    description: 'Tên, logo, địa chỉ và liên hệ xuất hiện ở top bar, phần giới thiệu, liên hệ và footer.',
    href: '/#gioi-thieu-giao-xu',
    icon: Settings,
  },
  settings: {
    title: 'Tiêu đề trên Google và trình duyệt',
    description: 'Cấu hình SEO quyết định tiêu đề và mô tả khi website được tìm kiếm hoặc chia sẻ.',
    href: '/',
    icon: Settings,
  },
  media: {
    title: 'Ảnh dùng trong nội dung',
    description: 'Sau khi tải lên, ảnh có thể được chọn làm banner, ảnh bài viết, album hoặc logo.',
    href: '/#tin-tuc-moi-nhat',
    icon: Image,
  },
};

export function HomepagePlacementGuide({ resource, sample = {}, compact = false }: Props) {
  const guide = guides[resource];
  if (!guide) return null;
  const Icon = guide.icon;
  return (
    <section className={`placement-guide ${compact ? 'compact' : ''}`}>
      <div className="placement-copy">
        <span><Eye /> XEM TRƯỚC NGOÀI WEBSITE</span>
        <h2>{guide.title}</h2>
        <p>{guide.description}</p>
        {!compact && <a href={guide.href} target="_blank" rel="noreferrer">Mở đúng vị trí ngoài trang <ArrowUpRight /></a>}
      </div>
      <div className={`placement-preview preview-${resource}`}>
        <Preview resource={resource} sample={sample} icon={Icon} />
      </div>
    </section>
  );
}

function Preview({ resource, sample, icon: Icon }: { resource: string; sample: Record<string, any>; icon: typeof Eye }) {
  const title = sample.title || sample.name || sample.label || sample.key;
  if (resource === 'banners') {
    return <div className="demo-hero" style={sample.imageUrl ? { backgroundImage: `linear-gradient(90deg,#062f55e8,#062f5540),url("${sample.imageUrl}")` } : undefined}><small>GIÁO PHẬN BÀ RỊA</small><strong>{title || 'Giáo xứ Đức Mỹ'}</strong><p>{sample.subtitle || 'Hiệp nhất trong đức tin — Lan tỏa yêu thương'}</p><i>Xem giờ lễ</i></div>;
  }
  if (resource === 'menus') {
    const items = sample.items || [];
    return <div className="demo-menu"><b>GIÁO XỨ ĐỨC MỸ</b><span>{items.length ? items.slice(0, 5).map((item: any) => <i key={item.id || item.label}>{item.label}</i>) : <><i>Trang chủ</i><i>Giới thiệu</i><i>Giờ lễ</i></>}</span></div>;
  }
  if (resource === 'mass-schedules') {
    return <div className="demo-quick"><Clock3 /><span><small>THÁNH LỄ HÔM NAY</small><strong>{sample.startTime || '05:00'} • 17:30</strong></span></div>;
  }
  if (resource === 'announcements') {
    return <div className="demo-quick"><Bell /><span><small>THÔNG BÁO MỚI NHẤT</small><strong>{title || 'Chương trình mục vụ trong tuần'}</strong></span></div>;
  }
  if (resource === 'events') {
    return <div className="demo-event"><time><b>{sample.startsAt ? new Date(sample.startsAt).getDate() : '25'}</b><small>THÁNG {sample.startsAt ? new Date(sample.startsAt).getMonth() + 1 : '8'}</small></time><span><small>{sample.location || 'Khuôn viên Giáo xứ'}</small><strong>{title || 'Sinh hoạt mục vụ'}</strong></span></div>;
  }
  if (resource === 'albums' || resource === 'media') {
    const imageUrl = sample.coverUrl || sample.secureUrl || sample.thumbnailUrl;
    return <div className="demo-album">{imageUrl ? <img src={imageUrl} alt="" /> : <Image />}<span>{title || sample.originalName || 'Đời sống Giáo xứ'}<small>Xem album →</small></span></div>;
  }
  if (resource === 'settings') {
    const value = typeof sample.value === 'object' ? sample.value : {};
    return <div className="demo-seo"><small>https://giaoxuducmy.vn</small><strong>{value.title || title || 'Giáo xứ Đức Mỹ'}</strong><p>{value.description || 'Cổng thông tin Giáo xứ Đức Mỹ'}</p></div>;
  }
  if (resource === 'parish-profile') {
    return <div className="demo-profile"><span>✝</span><div><small>{sample.diocese || 'GIÁO PHẬN BÀ RỊA'}</small><strong>{sample.name || 'GIÁO XỨ ĐỨC MỸ'}</strong><p>{sample.address || 'Địa chỉ giáo xứ'}</p></div></div>;
  }
  if (resource === 'home-sections') {
    return <div className="demo-section"><small>ĐỜI SỐNG GIÁO XỨ</small><strong>{title || 'Tin tức mới nhất'}</strong><span><i /><i /><i /></span></div>;
  }
  return <div className="demo-post"><div>{sample.imageUrl ? <img src={sample.imageUrl} alt="" /> : <Icon />}</div><span><small>{sample.name || 'TIN GIÁO XỨ'}</small><strong>{sample.title || 'Tiêu đề bài viết sẽ hiển thị tại đây'}</strong><p>{sample.excerpt || 'Mô tả ngắn của nội dung…'}</p></span></div>;
}
