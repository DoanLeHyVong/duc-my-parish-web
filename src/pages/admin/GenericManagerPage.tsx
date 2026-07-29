import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';

type Field = { key: string; label: string; type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'datetime-local'; required?: boolean };
const configs: Record<string, { title: string; fields: Field[] }> = {
  categories: { title: 'Chuyên mục', fields: [{ key: 'name', label: 'Tên chuyên mục', required: true }, { key: 'slug', label: 'Slug', required: true }, { key: 'description', label: 'Mô tả', type: 'textarea' }, { key: 'sortOrder', label: 'Thứ tự', type: 'number' }, { key: 'isActive', label: 'Đang hiển thị', type: 'checkbox' }] },
  tags: { title: 'Thẻ nội dung', fields: [{ key: 'name', label: 'Tên thẻ', required: true }, { key: 'slug', label: 'Slug', required: true }] },
  banners: { title: 'Banner', fields: [{ key: 'title', label: 'Tiêu đề', required: true }, { key: 'subtitle', label: 'Khẩu hiệu' }, { key: 'imageUrl', label: 'URL hình ảnh', required: true }, { key: 'sortOrder', label: 'Thứ tự', type: 'number' }, { key: 'isActive', label: 'Đang hiển thị', type: 'checkbox' }] },
  menus: { title: 'Menu', fields: [{ key: 'name', label: 'Tên menu', required: true }, { key: 'location', label: 'Vị trí', required: true }, { key: 'isActive', label: 'Đang dùng', type: 'checkbox' }] },
  'home-sections': { title: 'Section trang chủ', fields: [{ key: 'sectionKey', label: 'Mã section', required: true }, { key: 'title', label: 'Tiêu đề', required: true }, { key: 'componentType', label: 'Layout', required: true }, { key: 'displayLimit', label: 'Số bài', type: 'number' }, { key: 'sortOrder', label: 'Thứ tự', type: 'number' }, { key: 'isVisible', label: 'Hiển thị', type: 'checkbox' }] },
  announcements: { title: 'Thông báo', fields: [{ key: 'title', label: 'Tiêu đề', required: true }, { key: 'content', label: 'Nội dung', type: 'textarea', required: true }, { key: 'startsAt', label: 'Bắt đầu', type: 'datetime-local', required: true }, { key: 'endsAt', label: 'Kết thúc', type: 'datetime-local' }, { key: 'isPinned', label: 'Ghim', type: 'checkbox' }, { key: 'isActive', label: 'Hiển thị', type: 'checkbox' }] },
  'mass-schedules': { title: 'Giờ lễ', fields: [{ key: 'dayOfWeek', label: 'Ngày trong tuần (0–6)', type: 'number', required: true }, { key: 'startTime', label: 'Giờ lễ', required: true }, { key: 'massType', label: 'Loại Thánh lễ', required: true }, { key: 'location', label: 'Địa điểm', required: true }, { key: 'sortOrder', label: 'Thứ tự', type: 'number' }, { key: 'isActive', label: 'Hiển thị', type: 'checkbox' }] },
  events: { title: 'Sự kiện', fields: [{ key: 'title', label: 'Tên sự kiện', required: true }, { key: 'slug', label: 'Slug', required: true }, { key: 'description', label: 'Mô tả', type: 'textarea', required: true }, { key: 'startsAt', label: 'Thời gian', type: 'datetime-local', required: true }, { key: 'location', label: 'Địa điểm', required: true }, { key: 'imageUrl', label: 'URL ảnh' }, { key: 'isActive', label: 'Hiển thị', type: 'checkbox' }] },
  albums: { title: 'Album', fields: [{ key: 'title', label: 'Tên album', required: true }, { key: 'slug', label: 'Slug', required: true }, { key: 'description', label: 'Mô tả', type: 'textarea' }, { key: 'coverUrl', label: 'URL ảnh bìa' }, { key: 'isPublished', label: 'Xuất bản', type: 'checkbox' }] },
  settings: { title: 'Cấu hình', fields: [{ key: 'key', label: 'Khóa', required: true }, { key: 'group', label: 'Nhóm', required: true }, { key: 'value', label: 'Giá trị JSON', type: 'textarea', required: true }] },
};

export function GenericManagerPage({ resource }: { resource: string }) {
  const config = configs[resource] || { title: resource, fields: [] };
  const client = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['admin', resource], queryFn: () => api.get(`/admin/${resource}`).then((r) => r.data.data) });
  const save = useMutation({ mutationFn: (data: any) => editing ? api.put(`/admin/${resource}/${editing.id}`, data) : api.post(`/admin/${resource}`, data), onSuccess: () => { toast.success('Đã lưu thay đổi'); client.invalidateQueries({ queryKey: ['admin', resource] }); setOpen(false); setEditing(null); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Không thể lưu') });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/admin/${resource}/${id}`), onSuccess: () => { toast.success('Đã xóa'); client.invalidateQueries({ queryKey: ['admin', resource] }); } });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = new FormData(e.currentTarget); const data: any = {};
    for (const field of config.fields) {
      const raw = form.get(field.key);
      if (field.type === 'checkbox') data[field.key] = raw === 'on';
      else if (field.type === 'number') data[field.key] = Number(raw || 0);
      else if (resource === 'settings' && field.key === 'value') { try { data.value = JSON.parse(String(raw)); } catch { return toast.error('Giá trị JSON không hợp lệ'); } }
      else if (raw) data[field.key] = raw;
    }
    save.mutate(data);
  };
  return <><div className="admin-title"><div><span>QUẢN LÝ NỘI DUNG</span><h1>{config.title}</h1><p>Thêm, chỉnh sửa và sắp xếp dữ liệu hiển thị.</p></div>{resource !== 'audit-logs' && <button className="button navy" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Thêm mới</button>}</div><div className="admin-card table-wrap"><table><thead><tr><th>ID</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{q.data?.map((item: any) => <tr key={item.id}><td>#{item.id}</td><td><b>{item.title || item.name || item.key || item.action}</b><small>{item.slug || item.location || item.group || item.createdAt}</small></td><td><span className="status">{item.isActive === false || item.isVisible === false ? 'Ẩn' : 'Hoạt động'}</span></td><td><button onClick={() => { setEditing(item); setOpen(true); }}><Edit3 /></button><button className="danger" onClick={() => confirm('Bạn chắc chắn muốn xóa?') && remove.mutate(item.id)}><Trash2 /></button></td></tr>)}</tbody></table>{!q.data?.length && <div className="empty-state">Chưa có dữ liệu.</div>}</div>{open && <div className="modal-backdrop"><form className="admin-modal" onSubmit={submit}><div><h2>{editing ? `Chỉnh sửa ${config.title}` : `Thêm ${config.title}`}</h2><button type="button" onClick={() => setOpen(false)}><X /></button></div>{config.fields.map((field) => <label key={field.key} className={field.type === 'checkbox' ? 'check-field' : ''}>{field.type === 'checkbox' ? <><input name={field.key} type="checkbox" defaultChecked={editing?.[field.key] ?? true} /> {field.label}</> : <>{field.label}{field.type === 'textarea' ? <textarea name={field.key} rows={5} required={field.required} defaultValue={typeof editing?.[field.key] === 'object' ? JSON.stringify(editing[field.key], null, 2) : editing?.[field.key]} /> : <input name={field.key} type={field.type || 'text'} required={field.required} defaultValue={field.type === 'datetime-local' && editing?.[field.key] ? new Date(editing[field.key]).toISOString().slice(0, 16) : editing?.[field.key]} />}</>}</label>)}<div className="modal-actions"><button type="button" className="button outline" onClick={() => setOpen(false)}>Hủy</button><button className="button navy" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></form></div>}</>;
}
