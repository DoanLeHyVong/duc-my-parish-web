import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { HomepagePlacementGuide } from '../../components/admin/HomepagePlacementGuide';

export function PostsPage() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'posts'], queryFn: () => api.get('/admin/posts?limit=100').then((r) => r.data.data) });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/admin/posts/${id}`), onSuccess: () => { toast.success('Đã chuyển bài vào thùng rác'); client.invalidateQueries({ queryKey: ['admin', 'posts'] }); } });
  return <><div className="admin-title"><div><span>QUẢN LÝ NỘI DUNG</span><h1>Bài viết</h1><p>Soạn thảo, hẹn giờ và xuất bản bài viết.</p></div><Link className="button navy" to="/admin/posts/new"><Plus /> Viết bài mới</Link></div><HomepagePlacementGuide resource="posts" sample={q.data?.[0] || {}} /><div className="admin-card"><div className="table-toolbar"><div><Search /><input placeholder="Tìm bài viết…" /></div><select><option>Tất cả trạng thái</option><option>Đã đăng</option><option>Bản nháp</option></select></div><div className="table-wrap"><table><thead><tr><th>Bài viết</th><th>Trạng thái</th><th>Lượt xem</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{q.data?.map((post: any) => <tr key={post.id}><td><b>{post.title}</b><small>/{post.slug}</small></td><td><span className={`status ${post.status.toLowerCase()}`}>{post.status}</span></td><td>{post.viewCount}</td><td>{new Intl.DateTimeFormat('vi-VN').format(new Date(post.updatedAt))}</td><td><Link to={`/admin/posts/${post.id}/edit`}><Edit3 /></Link><button className="danger" onClick={() => confirm('Chuyển bài viết vào thùng rác?') && remove.mutate(post.id)}><Trash2 /></button></td></tr>)}</tbody></table></div></div></>;
}
