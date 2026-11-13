import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Church, Clock3, Mail, MapPin, Phone, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../apis/public.api';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageSeo } from '../../components/common/SiteSeo';
import { PostCard } from '../../components/public/PostCard';
import { SectionHeading } from '../../components/public/SectionHeading';
import type { Event, MassSchedule, Post } from '../../types';

const categoryAliases: Record<string, string> = {
  'parish-news': 'tin-giao-xu',
  announcements: 'thong-bao',
  'daily-word': 'loi-chua-hang-ngay',
  'diocese-news': 'tin-giao-phan',
  'bible-study': 'hoc-hoi-kinh-thanh',
  catechism: 'giao-ly',
};

export function ArticlePage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['post', slug], queryFn: () => publicApi.post(slug) });
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  const p = q.data;
  const structured = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.publishedAt, image: p.featuredImage?.secureUrl };
  return <><PageSeo title={p.seoTitle || p.title} description={p.seoDescription || p.excerpt} image={p.featuredImage?.secureUrl} /><Helmet><script type="application/ld+json">{JSON.stringify(structured)}</script></Helmet><PageHero title={p.title} eyebrow={p.categories?.[0]?.category.name || 'Bài viết'} /><article className="article container"><div className="article-meta"><CalendarDays /> {p.publishedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(p.publishedAt)) : 'Mới cập nhật'} · {p.viewCount} lượt xem</div>{p.featuredImage && <img className="article-cover" src={p.featuredImage.secureUrl} alt={p.title} />}<p className="article-lead">{p.excerpt}</p><div className="article-content" dangerouslySetInnerHTML={{ __html: p.content }} /></article></>;
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const cmsSlug = Object.prototype.hasOwnProperty.call(categoryAliases, slug) ? categoryAliases[slug]! : slug;
  const q = useQuery({ queryKey: ['category', cmsSlug], queryFn: () => publicApi.category(cmsSlug) });
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  return <><PageSeo title={q.data.category.seoTitle || q.data.category.name} description={q.data.category.seoDescription || q.data.category.description} /><PageHero title={q.data.category.name} eyebrow="CHUYÊN MỤC" /><Listing posts={q.data.posts} /></>;
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
  if (q.isError) return <ErrorState retry={() => q.refetch()} />;
  return <><PageHero title="Giờ Thánh lễ" eyebrow="Lịch phụng vụ" />{q.isLoading ? <LoadingState /> : <section className="section"><div className="container mass-page"><SectionHeading title="Lịch lễ trong tuần" /><div className="mass-table">{days.map((day, index) => <div key={day}><strong>{day}</strong><span>{(q.data as MassSchedule[])?.filter((m) => m.dayOfWeek === index).map((m) => m.startTime).join('  •  ') || '—'}</span></div>)}</div></div></section>}</>;
}

export function EventsPage() {
  const q = useQuery({ queryKey: ['events'], queryFn: publicApi.events });
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState retry={() => q.refetch()} />;
  return <><PageHero title="Sự kiện & sinh hoạt" eyebrow="ĐỒNG HÀNH CÙNG CỘNG ĐOÀN" /><section className="section"><div className="container event-list">{(q.data as Event[])?.length ? (q.data as Event[]).map((event) => <article key={event.id}><time><b>{new Date(event.startsAt).getDate()}</b><span>THÁNG {new Date(event.startsAt).getMonth() + 1}</span></time><div><h2><Link to={`/events/${event.slug}`}>{event.title}</Link></h2><p><Clock3 /> {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.startsAt))}</p><p><MapPin /> {event.location}</p><p>{event.description}</p></div></article>) : <p>Chưa có sự kiện được công bố.</p>}</div></section></>;
}

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['event', slug], queryFn: () => publicApi.event(slug) });
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  const event = q.data as Event;
  return <><PageSeo title={event.seoTitle || event.title} description={event.seoDescription || event.description} image={event.imageUrl} /><PageHero title={event.title} eyebrow="Sự kiện" image={event.imageUrl} /><article className="article container"><p><Clock3 /> {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.startsAt))}</p><p><MapPin /> {event.location}</p><p>{event.description}</p></article></>;
}

export function LibraryPage() {
  const q = useQuery({ queryKey: ['albums'], queryFn: publicApi.albums });
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState retry={() => q.refetch()} />;
  return <><PageHero title="Thư viện" eyebrow="Hình ảnh" /><section className="section warm-section"><div className="container album-grid">{q.data?.length ? q.data.map((album: any) => <Link className="library-card" key={album.id} to={`/gallery/${album.id}`}>{album.coverUrl && <img src={album.coverUrl} alt={album.title} />}<div><h2>{album.title}</h2><p>{album.description}</p></div></Link>) : <p>Chưa có album được công bố.</p>}</div></section></>;
}

export function AlbumDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['album', id], queryFn: () => publicApi.album(id), enabled: /^\d+$/.test(id) });
  if (!/^\d+$/.test(id)) return <ErrorState />;
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <ErrorState retry={() => q.refetch()} />;
  const album = q.data as { title: string; description?: string; coverUrl?: string; media: { id: number; media: { secureUrl: string; altText?: string; originalName: string } }[] };
  return <><PageSeo title={album.title} description={album.description} image={album.coverUrl} /><PageHero title={album.title} eyebrow="Thư viện" image={album.coverUrl} /><section className="section"><div className="container"><p>{album.description}</p>{album.media.length ? <div className="album-grid">{album.media.map((item) => <img key={item.id} src={item.media.secureUrl} alt={item.media.altText || item.media.originalName} loading="lazy" />)}</div> : <p>Album chưa có ảnh.</p>}</div></section></>;
}

export function AboutPage() {
  const q = useQuery({ queryKey: ['profile'], queryFn: publicApi.profile });
  return <><PageHero title={q.data?.name || 'Giới thiệu'} eyebrow={q.data?.diocese || ''} image={q.data?.heroUrl} /><section className="section"><div className="container about-detail">{q.data?.heroUrl && <img src={q.data.heroUrl} alt={q.data.name} />}<div><span className="eyebrow">{q.data?.diocese}</span><h2>{q.data?.tagline}</h2><p>{q.data?.description}</p></div></div></section></>;
}

export function ContactPage() {
  const q = useQuery({ queryKey: ['profile'], queryFn: publicApi.profile });
  const p = q.data;
  return <><PageHero title="Liên hệ" eyebrow={p?.name || ''} /><section className="section"><div className="container contact-grid"><div><SectionHeading title={p?.name || 'Giáo xứ'} /><p><MapPin /> {p?.address}</p>{p?.phone && <p><Phone /> {p.phone}</p>}{p?.email && <p><Mail /> {p.email}</p>}<p><Church /> {p?.diocese}</p></div></div></section>{p?.mapEmbedUrl && <div className="map-placeholder"><iframe src={p.mapEmbedUrl} loading="lazy" title={`Bản đồ ${p.name}`} /></div>}</>;
}

export function NotFoundPage() {
  return <div className="not-found"><Church /><span>404</span><h1>Không tìm thấy trang</h1><p>Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển.</p><Link className="button navy" to="/">Về trang chủ</Link></div>;
}

function PageHero({ title, eyebrow, image }: { title: string; eyebrow: string; image?: string }) {
  return <section className="page-hero" style={{ backgroundImage: image ? `url("${image}")` : undefined }}><div /><span>{eyebrow}</span><h1>{title}</h1></section>;
}
function Listing({ posts }: { posts: Post[] }) {
  return <section className="section"><div className="container">{posts.length ? <div className="posts-grid compact">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div> : <div className="empty-state">Chưa có bài viết trong chuyên mục này.</div>}</div></section>;
}
