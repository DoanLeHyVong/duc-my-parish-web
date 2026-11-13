import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { MediaPicker } from '../../components/admin/MediaPicker';

const fields = [
  ['name', 'Tên giáo xứ', true], ['diocese', 'Giáo phận', true], ['tagline', 'Khẩu hiệu'],
  ['address', 'Địa chỉ', true], ['phone', 'Số điện thoại'], ['email', 'Email'],
  ['facebookUrl', 'Facebook'], ['youtubeUrl', 'YouTube'], ['mapEmbedUrl', 'URL bản đồ'],
  ['seoTitle', 'Tiêu đề SEO mặc định'], ['seoDescription', 'Mô tả SEO mặc định'],
  ['footerText', 'Giới thiệu chân trang'], ['copyrightText', 'Bản quyền'],
] as const;
const images = [
  ['logoUrl', 'Logo chính thức'], ['faviconUrl', 'Favicon (nên dùng PNG vuông)'],
  ['heroUrl', 'Ảnh bìa mặc định'], ['ogImageUrl', 'Ảnh chia sẻ mạng xã hội'],
] as const;
const seoPages = [
  ['/about', 'Giới thiệu'], ['/contact', 'Liên hệ'], ['/mass-schedule', 'Giờ Thánh lễ'],
  ['/events', 'Sự kiện'], ['/gallery', 'Thư viện'], ['/privacy', 'Quyền riêng tư'],
  ['/terms', 'Điều khoản'], ['/support', 'Hỗ trợ'], ['/data-request', 'Yêu cầu dữ liệu'],
] as const;

export function ProfilePage() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'parish-profile'], queryFn: () => api.get('/admin/parish-profile').then((r) => r.data.data[0] as Record<string, unknown> | undefined) });
  const [form, setForm] = useState<Record<string, string>>({});
  const [pageSeo, setPageSeo] = useState<Record<string, { title: string; description: string; image: string }>>({});
  useEffect(() => { if (q.data) setForm(Object.fromEntries([...fields.map(([key]) => key), ...images.map(([key]) => key), 'description'].map((key) => [key, String(q.data?.[key] ?? '')]))); }, [q.data]);
  useEffect(() => { if (q.data) setPageSeo(Object.fromEntries(seoPages.map(([path]) => {
    const entry = (q.data?.pageSeo as Record<string, { title?: string; description?: string; image?: string }> | undefined)?.[path];
    return [path, { title: entry?.title || '', description: entry?.description || '', image: entry?.image || '' }];
  }))); }, [q.data]);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateSeo = (path: string, key: 'title' | 'description' | 'image', value: string) => setPageSeo((current) => ({ ...current, [path]: { ...current[path], [key]: value } }));
  const save = useMutation({
    mutationFn: () => q.data?.id ? api.put(`/admin/parish-profile/${q.data.id}`, { ...form, pageSeo }) : api.post('/admin/parish-profile', { ...form, pageSeo }),
    onSuccess: () => { toast.success('Đã lưu cấu hình website'); client.invalidateQueries({ queryKey: ['home'] }); client.invalidateQueries({ queryKey: ['profile'] }); client.invalidateQueries({ queryKey: ['admin', 'parish-profile'] }); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Không thể lưu. Nội dung đang nhập được giữ lại.'),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  if (q.isPending) return <div className="admin-card">Đang tải cấu hình website…</div>;
  if (q.isError) return <div className="admin-card" role="alert">Không thể tải cấu hình. <button onClick={() => q.refetch()}>Thử lại</button></div>;
  return <>
    <div className="admin-title"><div><span>THƯƠNG HIỆU & SEO</span><h1>Cấu hình website</h1><p>Thay đổi nội dung hiển thị ngay sau khi lưu, không cần sửa mã nguồn.</p></div></div>
    <form className="admin-card profile-form" onSubmit={submit}>
      <h2>Thông tin giáo xứ</h2>
      <div className="profile-fields">{fields.map(([key, label, required]) => <label key={key}>{label}<input type={key === 'email' ? 'email' : 'text'} required={Boolean(required)} value={form[key] || ''} onChange={(event) => update(key, event.target.value)} /></label>)}</div>
      <label>Giới thiệu giáo xứ<textarea rows={6} required value={form.description || ''} onChange={(event) => update('description', event.target.value)} /></label>
      <h2>Hình ảnh thương hiệu</h2><p>Ảnh được tải qua Cloudinary. Bỏ ảnh ở đây không xóa ảnh đang dùng ở nội dung khác.</p>
      <div className="cms-brand-grid">{images.map(([key, label]) => <MediaPicker key={key} label={label} value={form[key]} folder="branding" onChange={(url) => update(key, url)} />)}</div>
      <h2>SEO cho từng trang</h2><p>Để trống để dùng tiêu đề và mô tả mặc định của website.</p>
      {seoPages.map(([path, label]) => <fieldset key={path} className="cms-page-seo"><legend>{label} ({path})</legend>
        <label>Tiêu đề<input value={pageSeo[path]?.title || ''} onChange={(event) => updateSeo(path, 'title', event.target.value)} /></label>
        <label>Mô tả<textarea rows={2} value={pageSeo[path]?.description || ''} onChange={(event) => updateSeo(path, 'description', event.target.value)} /></label>
        <MediaPicker label="Ảnh chia sẻ" value={pageSeo[path]?.image} folder="branding" onChange={(url) => updateSeo(path, 'image', url)} />
      </fieldset>)}
      <button className="button navy" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu cấu hình website'}</button>
    </form>
  </>;
}
