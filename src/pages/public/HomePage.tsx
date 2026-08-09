import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, BookOpen, CalendarDays, Church, Clock3, MapPin, PlayCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { A11y, Autoplay, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { publicApi } from '../../apis/public.api';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PostCard } from '../../components/public/PostCard';
import { SectionHeading } from '../../components/public/SectionHeading';

const fallbackHero = '/hero-duc-my-v2.png';
const categoryPosts = (posts: any[], slug: string) => posts.filter((p) => p.categories?.some((c: any) => c.category.slug === slug));

export function HomePage() {
  const query = useQuery({ queryKey: ['home'], queryFn: publicApi.home, staleTime: 60_000 });
  if (query.isLoading) return <LoadingState />;
  if (!query.data) return <ErrorState retry={() => query.refetch()} />;
  const d = query.data;
  const hero = d.banners[0];
  const today = new Date().getDay();
  const todayMasses = d.massSchedules.filter((m) => m.dayOfWeek === today);
  const sectionTitle = (key: string, fallback: string) => d.sections.find((s) => s.sectionKey === key)?.title || fallback;
  const latest = d.posts.slice(0, 6);
  const word = categoryPosts(d.posts, 'loi-chua-hang-ngay');
  const diocese = categoryPosts(d.posts, 'tin-giao-phan');
  const bible = categoryPosts(d.posts, 'hoc-hoi-kinh-thanh');
  const catechism = categoryPosts(d.posts, 'giao-ly');
  return (
    <>
      <Helmet>
        <title>Giáo xứ Đức Mỹ | Giáo phận Bà Rịa</title>
        <meta name="description" content="Cổng thông tin Giáo xứ Đức Mỹ — Hiệp nhất trong đức tin, lan tỏa yêu thương." />
        <link rel="canonical" href={import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin)} />
      </Helmet>
      <section id="banner-trang-chu" className="hero" style={{ backgroundImage: `url("${hero?.imageUrl || d.profile?.heroUrl || fallbackHero}")` }}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="hero-eyebrow">GIÁO PHẬN BÀ RỊA</span>
          <span className="hero-ornament" aria-hidden="true"><i />✣<i /></span>
          <h1>Giáo xứ <em>Đức Mỹ</em></h1>
          <p>{hero?.subtitle || 'Hiệp nhất trong đức tin — Lan tỏa yêu thương'}</p>
          <div className="hero-buttons"><Link className="button gold" to="/gio-le"><Clock3 /> Xem giờ lễ</Link><Link className="button glass" to="/chuyen-muc/thong-bao"><Bell /> Thông báo mới</Link></div>
        </div>
      </section>
      <section id="gio-le-hom-nay" className="quick-info">
        <div className="container quick-grid">
          <div className="quick-card mass"><div className="quick-icon"><Clock3 /></div><div><span>THÁNH LỄ HÔM NAY</span><strong>{todayMasses.length ? todayMasses.map((m) => m.startTime).join('  •  ') : 'Xin xem lịch tuần'}</strong></div><Link to="/gio-le"><ArrowRight /></Link></div>
          <div className="quick-card notice"><div className="quick-icon"><Bell /></div><div><span>THÔNG BÁO MỚI NHẤT</span><strong>{d.announcements[0]?.title || 'Chưa có thông báo mới'}</strong></div><Link to="/chuyen-muc/thong-bao"><ArrowRight /></Link></div>
        </div>
      </section>
      <section id="gioi-thieu-giao-xu" className="section about-section">
        <div className="container about-grid">
          <div className="about-image"><img src={d.profile?.heroUrl || fallbackHero} alt="Nhà thờ Giáo xứ Đức Mỹ" /><span><Church /><b>Cộng đoàn<br />Đức Mỹ</b></span></div>
          <div className="about-copy"><span className="eyebrow">VỀ CHÚNG TÔI</span><h2>{sectionTitle('about', 'Giới thiệu Giáo xứ Đức Mỹ')}</h2><div className="gold-rule" /><p>{d.profile?.description}</p><blockquote>“Anh em hãy yêu thương nhau như Thầy đã yêu thương anh em.”<cite>— Ga 15,12</cite></blockquote><Link to="/gioi-thieu" className="button navy">Tìm hiểu thêm <ArrowRight /></Link></div>
        </div>
      </section>
      <section id="tin-tuc-moi-nhat" className="section warm-section">
        <div className="container"><SectionHeading eyebrow="ĐỜI SỐNG GIÁO XỨ" title={sectionTitle('latest-news', 'Tin tức mới nhất')} /><div className="posts-grid">{latest.map((p, i) => <PostCard key={p.id} post={p} featured={i === 0} />)}</div><div className="center"><Link className="button outline" to="/chuyen-muc/tin-giao-xu">Xem tất cả tin tức <ArrowRight /></Link></div></div>
      </section>
      <section id="thong-bao-trang-chu" className="section announcement-section">
        <div className="container announcement-grid">
          <div><span className="eyebrow light">THÔNG TIN MỤC VỤ</span><h2>{sectionTitle('announcements', 'Thông báo giáo xứ')}</h2><p>Cập nhật những thông tin mới nhất về sinh hoạt và chương trình mục vụ.</p><Link className="button gold" to="/chuyen-muc/thong-bao">Xem tất cả</Link></div>
          <div className="announcement-list">{d.announcements.map((a) => <article key={a.id}><time><b>{new Date(a.startsAt).getDate().toString().padStart(2, '0')}</b><span>THÁNG {new Date(a.startsAt).getMonth() + 1}</span></time><div><h3>{a.title}</h3><p>{a.content}</p></div><ArrowRight /></article>)}</div>
        </div>
      </section>
      <section id="noi-dung-trang-chu" className="section scripture-section">
        <div className="container scripture-grid"><div className="scripture-icon"><BookOpen /></div><div><span>LỜI CHÚA HÔM NAY</span><h2>{word[0]?.title || 'Hãy ở lại trong tình yêu của Thầy'}</h2><p>“Lời Chúa là ngọn đèn soi cho con bước, là ánh sáng chỉ đường con đi.”</p><Link to={word[0] ? `/bai-viet/${word[0].slug}` : '/chuyen-muc/loi-chua-hang-ngay'}>Đọc và suy niệm <ArrowRight /></Link></div></div>
      </section>
      <ContentSection eyebrow="HIỆP THÔNG" title={sectionTitle('diocese-news', 'Tin Giáo phận')} posts={diocese.length ? diocese : latest.slice(3)} link="/chuyen-muc/tin-giao-phan" />
      <ContentSection eyebrow="CÙNG NHAU HỌC HỎI" title={sectionTitle('bible-study', 'Học hỏi Kinh Thánh')} posts={bible.length ? bible : latest.slice(0, 3)} link="/chuyen-muc/hoc-hoi-kinh-thanh" warm />
      <ContentSection eyebrow="NUÔI DƯỠNG ĐỨC TIN" title={sectionTitle('catechism', 'Giáo lý')} posts={catechism.length ? catechism : latest.slice(2, 5)} link="/chuyen-muc/giao-ly" />
      <section id="su-kien-trang-chu" className="section events-section"><div className="container"><SectionHeading eyebrow="ĐỒNG HÀNH CÙNG CỘNG ĐOÀN" title={sectionTitle('events', 'Sự kiện & lịch sinh hoạt')} light /><div className="event-grid">{d.events.map((event) => <article key={event.id}><time><b>{new Date(event.startsAt).getDate()}</b><span>THÁNG {new Date(event.startsAt).getMonth() + 1}</span></time><div><small><MapPin /> {event.location}</small><h3>{event.title}</h3><p>{event.description}</p></div></article>)}</div><div className="center"><Link className="button glass" to="/su-kien">Xem lịch sự kiện</Link></div></div></section>
      <section id="album-trang-chu" className="section warm-section"><div className="container"><SectionHeading eyebrow="KHOẢNH KHẮC ĐỨC TIN" title={sectionTitle('albums', 'Album hình ảnh')} /><Swiper modules={[Navigation, Autoplay, A11y]} navigation autoplay={{ delay: 4500 }} spaceBetween={24} breakpoints={{ 0: { slidesPerView: 1.15 }, 700: { slidesPerView: 2.2 }, 1000: { slidesPerView: 3.2 } }}>{(d.albums.length ? d.albums : [{ id: 0, title: 'Đời sống Giáo xứ Đức Mỹ', slug: 'doi-song-giao-xu', coverUrl: fallbackHero }]).map((a) => <SwiperSlide key={a.id}><Link className="album-card" to="/thu-vien"><img src={a.coverUrl || fallbackHero} alt={a.title} /><span>{a.title}<small>Xem album →</small></span></Link></SwiperSlide>)}</Swiper></div></section>
      <section className="section video-section"><div className="container video-grid"><div><span className="eyebrow light">VIDEO MỚI NHẤT</span><h2>{sectionTitle('videos', 'Cùng lắng nghe và suy niệm')}</h2><p>Những bài giảng và chia sẻ giúp cộng đoàn sống Lời Chúa mỗi ngày.</p><Link className="button gold" to="/thu-vien">Xem thư viện video</Link></div><div className="video-cover"><img src={d.profile?.heroUrl || fallbackHero} alt="" /><button aria-label="Phát video"><PlayCircle /></button></div></div></section>
      <section className="contact-strip"><div className="container"><div><Church /><span><small>GIÁO XỨ ĐỨC MỸ</small><strong>Hân hoan chào đón quý cộng đoàn</strong></span></div><p><MapPin /> {d.profile?.address}</p><p><CalendarDays /> Thánh lễ mỗi ngày</p><Link className="button navy" to="/lien-he">Liên hệ chúng tôi</Link></div></section>
    </>
  );
}

function ContentSection({ eyebrow, title, posts, link, warm = false }: { eyebrow: string; title: string; posts: any[]; link: string; warm?: boolean }) {
  return <section className={`section ${warm ? 'warm-section' : ''}`}><div className="container"><SectionHeading eyebrow={eyebrow} title={title} /><div className="posts-grid compact">{posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}</div><div className="center"><Link className="text-link large" to={link}>Xem thêm <ArrowRight /></Link></div></div></section>;
}
