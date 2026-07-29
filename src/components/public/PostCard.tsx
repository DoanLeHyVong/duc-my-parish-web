import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';

const fallback = 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=900&q=80';

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={`post-card ${featured ? 'featured' : ''}`}>
      <Link to={`/bai-viet/${post.slug}`} className="post-image">
        <img src={post.featuredImage?.secureUrl || fallback} alt={post.featuredImage?.altText || post.title} />
        <span>{post.categories?.[0]?.category.name || 'Giáo xứ'}</span>
      </Link>
      <div className="post-body">
        <time><CalendarDays size={14} /> {post.publishedAt ? new Intl.DateTimeFormat('vi-VN').format(new Date(post.publishedAt)) : 'Mới cập nhật'}</time>
        <h3><Link to={`/bai-viet/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <Link className="text-link" to={`/bai-viet/${post.slug}`}>Đọc tiếp <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
