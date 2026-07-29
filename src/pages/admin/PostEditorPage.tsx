import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bold, Heading2, Italic, List, Quote, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../apis/client';

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function PostEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const editor = useEditor({ extensions: [StarterKit], content: '<p>Bắt đầu viết nội dung bài viết…</p>' });
  const post = useQuery({ queryKey: ['admin-post', id], queryFn: () => api.get(`/admin/posts/${id}`).then((r) => r.data.data), enabled: editing });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => api.get('/admin/categories?limit=100').then((r) => r.data.data) });
  useEffect(() => { if (!post.data || !editor) return; setTitle(post.data.title); setSlug(post.data.slug); setExcerpt(post.data.excerpt); setStatus(post.data.status); editor.commands.setContent(post.data.content); }, [post.data, editor]);
  const save = useMutation({ mutationFn: (data: any) => editing ? api.put(`/admin/posts/${id}`, data) : api.post('/admin/posts', data), onSuccess: () => { toast.success('Đã lưu bài viết'); navigate('/admin/posts'); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Không thể lưu bài viết') });
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate({ title, slug: slug || slugify(title), excerpt, content: editor?.getHTML() || '', status, categoryIds, publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined }); };
  return <form className="post-editor" onSubmit={submit}><div className="admin-title"><div><Link className="back-link" to="/admin/posts"><ArrowLeft /> Bài viết</Link><h1>{editing ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h1></div><div><button type="button" className="button outline" onClick={() => setStatus('DRAFT')}><Save /> Lưu nháp</button><button className="button navy" disabled={save.isPending}>{status === 'PUBLISHED' ? 'Cập nhật' : 'Lưu bài viết'}</button></div></div><div className="editor-grid"><div className="admin-card editor-main"><label>Tiêu đề<input className="title-input" value={title} required onChange={(e) => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} placeholder="Nhập tiêu đề bài viết" /></label><label>Đường dẫn<input value={slug} required onChange={(e) => setSlug(e.target.value)} /></label><label>Mô tả ngắn<textarea rows={3} value={excerpt} required onChange={(e) => setExcerpt(e.target.value)} /></label><label>Nội dung</label><div className="editor-toolbar"><button type="button" className={editor?.isActive('bold') ? 'active' : ''} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold /></button><button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic /></button><button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></button><button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List /></button><button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote /></button></div><EditorContent editor={editor} /></div><aside className="admin-card editor-side"><h3>Xuất bản</h3><label>Trạng thái<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="SCHEDULED">Hẹn giờ</option><option value="ARCHIVED">Lưu trữ</option></select></label><h3>Chuyên mục</h3><div className="category-checks">{categories.data?.map((c: any) => <label key={c.id}><input type="checkbox" checked={categoryIds.includes(c.id)} onChange={(e) => setCategoryIds(e.target.checked ? [...categoryIds, c.id] : categoryIds.filter((v) => v !== c.id))} /> {c.name}</label>)}</div><h3>Ảnh đại diện</h3><div className="image-picker">Chọn ảnh từ Thư viện Media</div><h3>SEO</h3><p>Tiêu đề và mô tả sẽ dùng dữ liệu bài viết nếu không nhập riêng.</p></aside></div></form>;
}
