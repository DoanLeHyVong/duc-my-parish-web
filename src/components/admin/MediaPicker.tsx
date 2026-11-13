import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../apis/client';

type Media = { id: number; secureUrl: string; thumbnailUrl?: string; altText?: string; originalName: string };

export function MediaPicker({ label, value, onChange, folder = 'general', onSelect }: {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  onSelect?: (asset: Media | null) => void;
  folder?: 'general' | 'branding' | 'banners' | 'posts' | 'albums';
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const media = useQuery({
    queryKey: ['admin', 'media', page],
    queryFn: () => api.get<{ data: Media[]; meta: { totalPages: number } }>(`/admin/media?page=${page}&limit=50`).then((r) => r.data),
    enabled: open,
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('files', file);
      body.append('folder', folder);
      const response = await api.post<{ data: Media[] }>('/admin/media/upload', body);
      return response.data.data[0];
    },
    onSuccess: (asset) => {
      if (asset) { onChange(asset.secureUrl); onSelect?.(asset); }
      client.invalidateQueries({ queryKey: ['admin', 'media'] });
      setOpen(false);
    },
  });
  return <div className="cms-media-picker">
    <strong>{label}</strong>
    {value ? <img className="cms-media-preview" src={value} alt={`Xem trước ${label}`} /> : <p>Chưa chọn ảnh</p>}
    <div className="cms-media-actions">
      <label className="button outline">{upload.isPending ? 'Đang tải…' : 'Tải ảnh lên'}<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={upload.isPending} onChange={(e) => { const file = e.target.files?.[0]; if (file) upload.mutate(file); e.target.value = ''; }} /></label>
      <button type="button" className="button outline" onClick={() => setOpen((current) => !current)}>{open ? 'Đóng thư viện' : 'Chọn từ thư viện'}</button>
      {value && <button type="button" className="button outline" onClick={() => { onChange(''); onSelect?.(null); }}>Bỏ ảnh khỏi mục này</button>}
    </div>
    {upload.isError && <p role="alert">Tải ảnh thất bại. Vui lòng thử lại.</p>}
    {open && <div className="cms-media-library">
      {media.isPending && <p>Đang tải thư viện ảnh…</p>}
      {media.isError && <p role="alert">Không thể tải thư viện. <button type="button" onClick={() => media.refetch()}>Thử lại</button></p>}
      {media.data?.data.length === 0 && <p>Thư viện chưa có ảnh.</p>}
      {media.data?.data.map((asset) => <button key={asset.id} type="button" onClick={() => { onChange(asset.secureUrl); onSelect?.(asset); setOpen(false); }} title={asset.originalName}><img src={asset.thumbnailUrl || asset.secureUrl} alt={asset.altText || asset.originalName} /></button>)}
      {(media.data?.meta.totalPages || 0) > 1 && <div className="cms-media-pages"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button><span>Trang {page}/{media.data?.meta.totalPages}</span><button type="button" disabled={page >= (media.data?.meta.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>Sau</button></div>}
    </div>}
  </div>;
}
