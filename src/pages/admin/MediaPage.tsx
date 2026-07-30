import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clipboard, CloudUpload, Image, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { HomepagePlacementGuide } from '../../components/admin/HomepagePlacementGuide';

export function MediaPage() {
  const input = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'media'], queryFn: () => api.get('/admin/media?limit=100').then((r) => r.data.data) });
  const upload = useMutation({ mutationFn: (files: FileList) => { const body = new FormData(); Array.from(files).forEach((f) => body.append('files', f)); body.append('folder', 'general'); return api.post('/admin/media/upload', body); }, onSuccess: () => { toast.success('Upload thành công'); client.invalidateQueries({ queryKey: ['admin', 'media'] }); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Upload thất bại') });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/admin/media/${id}`), onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'media'] }) });
  return <><div className="admin-title"><div><span>THƯ VIỆN CLOUDINARY</span><h1>Media</h1><p>Quản lý hình ảnh dùng trên toàn website.</p></div><button className="button navy" onClick={() => input.current?.click()}><CloudUpload /> Tải ảnh lên</button><input ref={input} hidden multiple accept="image/jpeg,image/png,image/webp,image/gif" type="file" onChange={(e) => e.target.files && upload.mutate(e.target.files)} /></div><HomepagePlacementGuide resource="media" sample={q.data?.[0] || {}} />{upload.isPending && <div className="upload-progress">Đang tải ảnh lên Cloudinary…</div>}<div className="media-grid">{q.data?.map((media: any) => <article key={media.id}><div>{media.thumbnailUrl || media.secureUrl ? <img src={media.thumbnailUrl || media.secureUrl} alt={media.altText || media.originalName} /> : <Image />}</div><b>{media.originalName}</b><small>{Math.round(media.bytes / 1024)} KB · {media.format}</small><span><button onClick={() => { navigator.clipboard.writeText(media.secureUrl); toast.success('Đã sao chép URL'); }}><Clipboard /></button><button className="danger" onClick={() => confirm('Xóa ảnh khỏi Cloudinary?') && remove.mutate(media.id)}><Trash2 /></button></span></article>)}</div>{!q.data?.length && <div className="empty-state admin-card">Chưa có ảnh. Cloudinary credentials cần được cấu hình trong backend để upload thật.</div>}</>;
}
