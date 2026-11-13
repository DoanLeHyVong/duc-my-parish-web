import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, BookOpen, Church, Clock3, MapPin } from 'lucide-react';
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
import type { HomeData, HomeSection, Post } from '../../types';

const categorySlugs: Record<string, string> = {
  'diocese-news': 'tin-giao-phan', 'bible-study': 'hoc-hoi-kinh-thanh',
  catechism: 'giao-ly', 'daily-word': 'loi-chua-hang-ngay',
};
const categoryPaths: Record<string, string> = {
  'diocese-news': '/categories/diocese-news', 'bible-study': '/categories/bible-study',
  catechism: '/categories/catechism',
};
function sectionPosts(data: HomeData, section: HomeSection) {
  const slug = section.category?.slug || categorySlugs[section.sectionKey];
  return slug ? data.posts.filter((post) => post.categories?.some((item) => item.category.slug === slug)) : data.posts;
}
function ContentSection({ section, posts, link }: { section: HomeSection; posts: Post[]; link: string }) {
  const settings = section.settings;
  return <section className={`section warm-section cms-layout-${section.componentType.toLowerCase()}`}><div className="container">
    <SectionHeading eyebrow={settings?.eyebrow} title={section.title} />
    {settings?.body && <p>{settings.body}</p>}
    {settings?.imageUrl && <img className="cms-section-image" src={settings.imageUrl} alt={section.title} />}
    {posts.length ? <div className="posts-grid compact">{posts.slice(0, section.displayLimit).map((post) => <PostCard key={post.id} post={post} />)}</div> : <p>Chưa có bài viết.</p>}
    <div className="center"><Link className="text-link large" to={settings?.ctaUrl || link}>{settings?.ctaText || 'Xem thêm'} <ArrowRight /></Link></div>
  </div></section>;
}
function ManagedSection({ section, data }: { section: HomeSection; data: HomeData }) {
  const settings = section.settings;
  switch (section.sectionKey) {
    case 'about':
      return <section id="gioi-thieu-giao-xu" className="section about-section"><div className="container about-grid">
        {(settings?.imageUrl || data.profile?.heroUrl) && <div className="about-image"><img src={settings?.imageUrl || data.profile?.heroUrl} alt={section.title} /><span><Church /><b>{data.profile?.name}</b></span></div>}
        <div className="about-copy"><span className="eyebrow">{settings?.eyebrow}</span><h2>{section.title}</h2><div className="gold-rule" /><p>{settings?.body || data.profile?.description}</p><Link to={settings?.ctaUrl || '/about'} className="button navy">{settings?.ctaText || 'Tìm hiểu thêm'} <ArrowRight /></Link></div>
      </div></section>;
    case 'latest-news':
      return <section id="tin-tuc-moi-nhat" className="section warm-section"><div className="container">
        <SectionHeading eyebrow={settings?.eyebrow} title={section.title} />{settings?.body && <p>{settings.body}</p>}
        {data.posts.length ? <div className="posts-grid">{data.posts.slice(0, section.displayLimit).map((post, index) => <PostCard key={post.id} post={post} featured={index === 0} />)}</div> : <p>Chưa có tin tức.</p>}
        <div className="center"><Link className="button outline" to={settings?.ctaUrl || '/categories/parish-news'}>{settings?.ctaText || 'Xem tin tức'} <ArrowRight /></Link></div>
      </div></section>;
    case 'announcements':
      return <section id="thong-bao-trang-chu" className="section announcement-section"><div className="container announcement-grid">
        <div><span className="eyebrow light">{settings?.eyebrow}</span><h2>{section.title}</h2><p>{settings?.body}</p><Link className="button gold" to={settings?.ctaUrl || '/categories/announcements'}>{settings?.ctaText || 'Xem tất cả'}</Link></div>
        <div className="announcement-list">{data.announcements.slice(0, section.displayLimit).map((item) => <article key={item.id}><time><b>{new Date(item.startsAt).getDate().toString().padStart(2, '0')}</b><span>THÁNG {new Date(item.startsAt).getMonth() + 1}</span></time><div><h3>{item.title}</h3><p>{item.content}</p></div><ArrowRight /></article>)}</div>
      </div></section>;
    case 'daily-word': {
      const post = sectionPosts(data, section)[0];
      return <section id="noi-dung-trang-chu" className="section scripture-section"><div className="container scripture-grid"><div className="scripture-icon"><BookOpen /></div><div>
        <span>{settings?.eyebrow || section.title}</span><h2>{post?.title || section.title}</h2><p>{settings?.body || post?.excerpt || 'Chưa có bài viết.'}</p>
        {post && <Link to={settings?.ctaUrl || `/posts/${post.slug}`}>{settings?.ctaText || 'Đọc tiếp'} <ArrowRight /></Link>}
      </div></div></section>;
    }
    case 'diocese-news':
    case 'bible-study':
    case 'catechism':
      return <ContentSection section={section} posts={sectionPosts(data, section)} link={section.category?.slug ? `/categories/${section.category.slug}` : categoryPaths[section.sectionKey]} />;
    case 'events':
      return <section id="su-kien-trang-chu" className="section events-section"><div className="container"><SectionHeading eyebrow={settings?.eyebrow} title={section.title} light />
        {settings?.body && <p>{settings.body}</p>}
        <div className="event-grid">{data.events.slice(0, section.displayLimit).map((event) => <article key={event.id}><time><b>{new Date(event.startsAt).getDate()}</b><span>THÁNG {new Date(event.startsAt).getMonth() + 1}</span></time><div><small><MapPin /> {event.location}</small><h3><Link to={`/events/${event.slug}`}>{event.title}</Link></h3><p>{event.description}</p></div></article>)}</div>
        <div className="center"><Link className="button glass" to={settings?.ctaUrl || '/events'}>{settings?.ctaText || 'Xem sự kiện'}</Link></div>
      </div></section>;
    case 'albums':
      return <section id="album-trang-chu" className="section warm-section"><div className="container"><SectionHeading eyebrow={settings?.eyebrow} title={section.title} />
        {data.albums.length ? <Swiper modules={[Navigation, Autoplay, A11y]} navigation autoplay={{ delay: 4500 }} spaceBetween={24} breakpoints={{ 0: { slidesPerView: 1.15 }, 700: { slidesPerView: 2.2 }, 1000: { slidesPerView: 3.2 } }}>{data.albums.slice(0, section.displayLimit).map((album) => <SwiperSlide key={album.id}><Link className="album-card" to={`/gallery/${album.id}`}>{album.coverUrl && <img src={album.coverUrl} alt={album.title} />}<span>{album.title}<small>Xem album →</small></span></Link></SwiperSlide>)}</Swiper> : <p>Chưa có album.</p>}
      </div></section>;
    case 'videos':
      return <section className="section video-section"><div className="container video-grid"><div><span className="eyebrow light">{settings?.eyebrow}</span><h2>{section.title}</h2><p>{settings?.body}</p>{settings?.ctaText && <Link className="button gold" to={settings?.ctaUrl || '/gallery'}>{settings.ctaText}</Link>}</div>{settings?.imageUrl && <div className="video-cover"><img src={settings.imageUrl} alt={section.title} /></div>}</div></section>;
    default:
      return <section className="section"><div className="container"><SectionHeading eyebrow={settings?.eyebrow} title={section.title} />{settings?.body && <p>{settings.body}</p>}{settings?.imageUrl && <img className="cms-section-image" src={settings.imageUrl} alt={section.title} />}{settings?.ctaText && settings.ctaUrl && <Link className="button navy" to={settings.ctaUrl}>{settings.ctaText}</Link>}</div></section>;
  }
}
export function HomePage() {
  const query = useQuery({ queryKey: ['home'], queryFn: publicApi.home, staleTime: 60_000 });
  if (query.isLoading) return <LoadingState />;
  if (!query.data) return <ErrorState retry={() => query.refetch()} />;
  const data = query.data;
  const hero = data.banners[0];
  const todayMasses = data.massSchedules.filter((mass) => mass.dayOfWeek === new Date().getDay());
  return <>
    <section id="banner-trang-chu" className="hero">
      {(hero?.imageUrl || data.profile?.heroUrl) && <picture className="hero-media">{hero?.mobileImageUrl && <source media="(max-width: 700px)" srcSet={hero.mobileImageUrl} />}<img src={hero?.imageUrl || data.profile?.heroUrl} alt="" /></picture>}
      <div className="hero-overlay" /><div className="container hero-content"><span className="hero-eyebrow">{data.profile?.diocese}</span><span className="hero-ornament" aria-hidden="true"><i />✣<i /></span><h1>{hero?.title || data.profile?.name || 'Giáo xứ'}</h1>
        {(hero?.subtitle || data.profile?.tagline) && <p>{hero?.subtitle || data.profile?.tagline}</p>}
        <div className="hero-buttons">{hero?.primaryText && hero.primaryUrl && <Link className="button gold" to={hero.primaryUrl}>{hero.primaryText}</Link>}{hero?.secondaryText && hero.secondaryUrl && <Link className="button glass" to={hero.secondaryUrl}>{hero.secondaryText}</Link>}</div>
      </div>
    </section>
    <section id="gio-le-hom-nay" className="quick-info"><div className="container quick-grid">
      <div className="quick-card mass"><div className="quick-icon"><Clock3 /></div><div><span>THÁNH LỄ HÔM NAY</span><strong>{todayMasses.length ? todayMasses.map((mass) => mass.startTime).join('  •  ') : 'Chưa có lịch lễ hôm nay'}</strong></div><Link to="/mass-schedule"><ArrowRight /></Link></div>
      <div className="quick-card notice"><div className="quick-icon"><Bell /></div><div><span>THÔNG BÁO MỚI NHẤT</span><strong>{data.announcements[0]?.title || 'Chưa có thông báo mới'}</strong></div><Link to="/categories/announcements"><ArrowRight /></Link></div>
    </div></section>
    {data.sections.map((section) => <ManagedSection key={section.id} section={section} data={data} />)}
    <section className="contact-strip"><div className="container"><div><Church /><span><small>{data.profile?.name}</small><strong>{data.profile?.tagline}</strong></span></div>{data.profile?.address && <p><MapPin /> {data.profile.address}</p>}<Link className="button navy" to="/contact">Liên hệ</Link></div></section>
  </>;
}
