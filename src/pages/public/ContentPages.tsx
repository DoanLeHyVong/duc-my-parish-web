import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Church, Clock3, Mail, MapPin, Phone, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../apis/public.api';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PostCard } from '../../components/public/PostCard';
import { SectionHeading } from '../../components/public/SectionHeading';
import type { Event, MassSchedule, Post } from '../../types';

const fallback = 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=85';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['post', slug], queryFn: () => publicApi.post(slug) });
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  const p = q.data;
  const structured = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.publishedAt, image: p.featuredImage?.secureUrl };
  return <><Helmet><title>{p.seoTitle || p.title} | Giáo xứ Đức Mỹ</title><meta name="description" content={p.excerpt} /><script type="application/ld+json">{JSON.stringify(structured)}</script></Helmet><PageHero title={p.title} eyebrow={p.categories?.[0]?.category.name || 'Bài viết'} /><article className="article container"><div className="article-meta"><CalendarDays /> {p.publishedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(p.publishedAt)) : 'Mới cập nhật'} · {p.viewCount} lượt xem</div>{p.featuredImage && <img className="article-cover" src={p.featuredImage.secureUrl} alt={p.title} />}<p className="article-lead">{p.excerpt}</p><div className="article-content" dangerouslySetInnerHTML={{ __html: p.content }} /></article></>;
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['category', slug], queryFn: () => publicApi.category(slug) });
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  return <><PageHero title={q.data.category.name} eyebrow="CHUYÊN MỤC" /><Listing posts={q.data.posts} /></>;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const term = params.get('q') || '';
  const q = useQuery({ queryKey: ['search', term], queryFn: () => publicApi.search(term), enabled: Boolean(term) });
  const submit = (e: FormEvent) => { e.preventDefault(); setParams(input ? { q: input } : {}); };
  return <><PageHero title="Tìm kiếm" eyebrow="KHÁM PHÁ NỘI DUNG" /><div className="container search-page"><form onSubmit={submit}><Search /><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập từ khóa…" /><button className="button navy">Tìm kiếm</button></form>{term && <h2>Kết quả cho “{term}”</h2>}{q.isLoading ? <LoadingState /> : q.data ? <Listing posts={q.data} /> : term ? <p>Không tìm thấy nội dung phù hợp.</p> : <p>Nhập từ khóa để tìm bài viết.</p>}</div></>;
}

export function MassPage() {
  const q = useQuery({ queryKey: ['masses'], queryFn: publicApi.masses });
  const days = ['Chúa nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return <><PageHero title="Giờ Thánh lễ" eyebrow="CÙNG HIỆP DÂNG" />{q.isLoading ? <LoadingState /> : <section className="section"><div className="container mass-page"><SectionHeading title="Lịch lễ trong tuần" eyebrow="GIÁO XỨ ĐỨC MỸ" /><div className="mass-table">{days.map((day, index) => <div key={day}><strong>{day}</strong><span>{(q.data as MassSchedule[])?.filter((m) => m.dayOfWeek === index).map((m) => m.startTime).join('  •  ') || '—'}</span><small>Nhà thờ Đức Mỹ</small></div>)}</div><p className="notice-box">Lịch trên là dữ liệu minh họa. Vui lòng liên hệ văn phòng giáo xứ để xác nhận các dịp lễ đặc biệt.</p></div></section>}</>;
}

export function EventsPage() {
  const q = useQuery({ queryKey: ['events'], queryFn: publicApi.events });
  return <><PageHero title="Sự kiện & sinh hoạt" eyebrow="ĐỒNG HÀNH CÙNG CỘNG ĐOÀN" /><section className="section"><div className="container event-list">{(q.data as Event[])?.map((event) => <article key={event.id}><time><b>{new Date(event.startsAt).getDate()}</b><span>THÁNG {new Date(event.startsAt).getMonth() + 1}</span></time><div><h2>{event.title}</h2><p><Clock3 /> {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.startsAt))}</p><p><MapPin /> {event.location}</p><p>{event.description}</p></div></article>)}</div></section></>;
}

export function LibraryPage() {
  const q = useQuery({ queryKey: ['albums'], queryFn: publicApi.albums });
  return <><PageHero title="Thư viện" eyebrow="KHOẢNH KHẮC ĐỨC TIN" /><section className="section warm-section"><div className="container album-grid">{q.data?.map((album: any) => <article className="library-card" key={album.id}><img src={album.coverUrl || fallback} alt={album.title} /><div><h2>{album.title}</h2><p>{album.description}</p></div></article>)}</div></section></>;
}

export function AboutPage() {
  const q = useQuery({ queryKey: ['profile'], queryFn: publicApi.profile });
  return <><PageHero title="Giới thiệu Giáo xứ Đức Mỹ" eyebrow="HIỆP NHẤT TRONG ĐỨC TIN" /><section className="section"><div className="container about-detail"><img src={q.data?.heroUrl || fallback} alt="Giáo xứ Đức Mỹ" /><div><span className="eyebrow">GIÁO PHẬN BÀ RỊA</span><h2>Một cộng đoàn sống động trong tình yêu Chúa</h2><p>{q.data?.description}</p><p>Nội dung lịch sử, thông tin cha xứ và các hội đoàn hiện là dữ liệu minh họa, có thể cập nhật trong trang quản trị.</p></div></div></section></>;
}

export function ContactPage() {
  const q = useQuery({ queryKey: ['profile'], queryFn: publicApi.profile });
  const p = q.data;
  return <><PageHero title="Liên hệ" eyebrow="GIÁO XỨ ĐỨC MỸ" /><section className="section"><div className="container contact-grid"><div><SectionHeading title="Hân hoan chào đón quý cộng đoàn" /><p><MapPin /> {p?.address}</p><p><Phone /> {p?.phone}</p><p><Mail /> {p?.email}</p><p><Church /> Giáo phận Bà Rịa</p></div><form className="contact-form" onSubmit={(e) => e.preventDefault()}><label>Họ và tên<input required /></label><label>Email<input type="email" required /></label><label>Nội dung<textarea rows={6} required /></label><button className="button navy">Gửi lời nhắn</button><small>Biểu mẫu minh họa — cần cấu hình dịch vụ gửi email trước khi sử dụng thật.</small></form></div></section><div className="map-placeholder">{p?.mapEmbedUrl ? <iframe src={p.mapEmbedUrl} loading="lazy" title="Bản đồ Giáo xứ Đức Mỹ" /> : <div><MapPin /><b>Google Maps</b><span>Vui lòng cập nhật URL bản đồ trong quản trị</span></div>}</div></>;
}

export function NotFoundPage() {
  return <div className="not-found"><Church /><span>404</span><h1>Không tìm thấy trang</h1><p>Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển.</p><Link className="button navy" to="/">Về trang chủ</Link></div>;
}

function PageHero({ title, eyebrow }: { title: string; eyebrow: string }) {
  return <section className="page-hero" style={{ backgroundImage: `url("${fallback}")` }}><div /><span>{eyebrow}</span><h1>{title}</h1></section>;
}
function Listing({ posts }: { posts: Post[] }) {
  return <section className="section"><div className="container">{posts.length ? <div className="posts-grid compact">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div> : <div className="empty-state">Chưa có bài viết trong chuyên mục này.</div>}</div></section>;
}
