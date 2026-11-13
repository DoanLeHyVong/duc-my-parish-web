import { ArrowUpRight, CalendarDays, Church } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={`post-card ${featured ? 'featured' : ''}`}>
      <Link to={`/posts/${post.slug}`} className="post-image">
        {post.featuredImage?.secureUrl ? <img src={post.featuredImage.secureUrl} alt={post.featuredImage.altText || post.title} /> : <span className="post-image-empty" aria-hidden="true"><Church /></span>}
        <span>{post.categories?.[0]?.category.name || 'Giáo xứ'}</span>
      </Link>
      <div className="post-body">
        <time><CalendarDays size={14} /> {post.publishedAt ? new Intl.DateTimeFormat('vi-VN').format(new Date(post.publishedAt)) : 'Mới cập nhật'}</time>
        <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <Link className="text-link" to={`/posts/${post.slug}`}>Đọc tiếp <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  );
}
