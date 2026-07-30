import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { HomepagePlacementGuide } from '../../components/admin/HomepagePlacementGuide';

export function ProfilePage() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'parish-profile'], queryFn: () => api.get('/admin/parish-profile').then((r) => r.data.data[0]) });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);
  const save = useMutation({ mutationFn: () => api.put(`/admin/parish-profile/${form.id}`, form), onSuccess: () => { toast.success('Đã cập nhật thông tin giáo xứ'); client.invalidateQueries({ queryKey: ['profile'] }); } });
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };
  const fields = [['name', 'Tên giáo xứ'], ['diocese', 'Giáo phận'], ['address', 'Địa chỉ'], ['phone', 'Điện thoại'], ['email', 'Email'], ['logoUrl', 'URL logo'], ['heroUrl', 'URL ảnh nhà thờ'], ['mapEmbedUrl', 'Google Maps embed URL'], ['facebookUrl', 'Facebook'], ['youtubeUrl', 'YouTube']];
  return <><div className="admin-title"><div><span>THÔNG TIN CHUNG</span><h1>Hồ sơ Giáo xứ</h1><p>Cập nhật thông tin hiển thị xuyên suốt website.</p></div></div><HomepagePlacementGuide resource="parish-profile" sample={form} /><form className="admin-card profile-form" onSubmit={submit}><div className="profile-fields">{fields.map(([key, label]) => <label key={key}>{label}<input value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><label>Giới thiệu<textarea rows={8} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><button className="button navy" disabled={save.isPending}>Lưu thông tin</button></form></>;
}
