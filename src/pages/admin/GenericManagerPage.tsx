import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { AdminDialog } from '../../components/admin/AdminDialog';
import { HomepagePlacementGuide } from '../../components/admin/HomepagePlacementGuide';
import { MediaPicker } from '../../components/admin/MediaPicker';

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'datetime-local' | 'image';
  required?: boolean;
};
const configs: Record<string, { title: string; fields: Field[] }> = {
  categories: {
    title: 'Chuyên mục',
    fields: [
      { key: 'name', label: 'Tên chuyên mục', required: true },
      { key: 'slug', label: 'Slug', required: true },
      { key: 'description', label: 'Mô tả', type: 'textarea' },
      { key: 'seoTitle', label: 'Tiêu đề SEO' },
      { key: 'seoDescription', label: 'Mô tả SEO', type: 'textarea' },
      { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
      { key: 'isActive', label: 'Đang hiển thị', type: 'checkbox' },
    ],
  },
  tags: {
    title: 'Thẻ nội dung',
    fields: [
      { key: 'name', label: 'Tên thẻ', required: true },
      { key: 'slug', label: 'Slug', required: true },
    ],
  },
  banners: {
    title: 'Banner',
    fields: [
      { key: 'title', label: 'Tiêu đề', required: true },
      { key: 'subtitle', label: 'Khẩu hiệu' },
      { key: 'imageUrl', label: 'Ảnh bìa desktop', type: 'image', required: true },
      { key: 'mobileImageUrl', label: 'Ảnh bìa điện thoại', type: 'image' },
      { key: 'primaryText', label: 'Nút thứ nhất — nội dung' },
      { key: 'primaryUrl', label: 'Nút thứ nhất — đường dẫn' },
      { key: 'secondaryText', label: 'Nút thứ hai — nội dung' },
      { key: 'secondaryUrl', label: 'Nút thứ hai — đường dẫn' },
      { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
      { key: 'isActive', label: 'Đang hiển thị', type: 'checkbox' },
      { key: 'startsAt', label: 'Bắt đầu hiển thị', type: 'datetime-local' },
      { key: 'endsAt', label: 'Ngừng hiển thị', type: 'datetime-local' },
    ],
  },
  menus: {
    title: 'Menu',
    fields: [
      { key: 'name', label: 'Tên menu', required: true },
      { key: 'location', label: 'Vị trí', required: true },
      { key: 'isActive', label: 'Đang dùng', type: 'checkbox' },
    ],
  },
  'home-sections': {
    title: 'Section trang chủ',
    fields: [
      { key: 'sectionKey', label: 'Mã section', required: true },
      { key: 'title', label: 'Tiêu đề', required: true },
      { key: 'componentType', label: 'Layout', required: true },
      { key: 'displayLimit', label: 'Số mục hiển thị', type: 'number', required: true },
      { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
      { key: 'isVisible', label: 'Hiển thị', type: 'checkbox' },
    ],
  },
  announcements: {
    title: 'Thông báo',
    fields: [
      { key: 'title', label: 'Tiêu đề', required: true },
      { key: 'content', label: 'Nội dung', type: 'textarea', required: true },
      { key: 'startsAt', label: 'Bắt đầu', type: 'datetime-local', required: true },
      { key: 'endsAt', label: 'Kết thúc', type: 'datetime-local' },
      { key: 'isPinned', label: 'Ghim', type: 'checkbox' },
      { key: 'isActive', label: 'Hiển thị', type: 'checkbox' },
    ],
  },
  'mass-schedules': {
    title: 'Giờ lễ',
    fields: [
      { key: 'dayOfWeek', label: 'Ngày trong tuần (0–6)', type: 'number', required: true },
      { key: 'startTime', label: 'Giờ lễ', required: true },
      { key: 'massType', label: 'Loại Thánh lễ', required: true },
      { key: 'location', label: 'Địa điểm', required: true },
      { key: 'sortOrder', label: 'Thứ tự', type: 'number' },
      { key: 'isActive', label: 'Hiển thị', type: 'checkbox' },
    ],
  },
  events: {
    title: 'Sự kiện',
    fields: [
      { key: 'title', label: 'Tên sự kiện', required: true },
      { key: 'slug', label: 'Slug', required: true },
      { key: 'description', label: 'Mô tả', type: 'textarea', required: true },
      { key: 'seoTitle', label: 'Tiêu đề SEO' },
      { key: 'seoDescription', label: 'Mô tả SEO', type: 'textarea' },
      { key: 'startsAt', label: 'Thời gian', type: 'datetime-local', required: true },
      { key: 'location', label: 'Địa điểm', required: true },
      { key: 'imageUrl', label: 'Ảnh sự kiện', type: 'image' },
      { key: 'isActive', label: 'Hiển thị', type: 'checkbox' },
    ],
  },
  albums: {
    title: 'Album',
    fields: [
      { key: 'title', label: 'Tên album', required: true },
      { key: 'slug', label: 'Slug', required: true },
      { key: 'description', label: 'Mô tả', type: 'textarea' },
      { key: 'seoTitle', label: 'Tiêu đề SEO' },
      { key: 'seoDescription', label: 'Mô tả SEO', type: 'textarea' },
      { key: 'coverUrl', label: 'Ảnh bìa', type: 'image' },
      { key: 'isPublished', label: 'Xuất bản', type: 'checkbox' },
    ],
  },
  settings: {
    title: 'Cấu hình',
    fields: [
      { key: 'key', label: 'Khóa', required: true },
      { key: 'group', label: 'Nhóm', required: true },
      { key: 'value', label: 'Giá trị JSON', type: 'textarea', required: true },
    ],
  },
};

export function GenericManagerPage({ resource }: { resource: string }) {
  const config = configs[resource] || { title: resource, fields: [] };
  const client = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const saveInFlightRef = useRef(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ['admin', resource],
    queryFn: () => api.get(`/admin/${resource}`).then((r) => r.data.data),
  });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => api.get('/admin/categories?limit=100').then((r) => r.data.data), enabled: resource === 'home-sections' });
  const save = useMutation({
    mutationFn: (data: any) =>
      editing
        ? api.put(`/admin/${resource}/${editing.id}`, data)
        : api.post(`/admin/${resource}`, data),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi');
      client.invalidateQueries({ queryKey: ['admin', resource] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Không thể lưu'),
    onSettled: () => {
      saveInFlightRef.current = false;
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/${resource}/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa');
      client.invalidateQueries({ queryKey: ['admin', resource] });
    },
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveInFlightRef.current) return;
    const form = new FormData(e.currentTarget);
    const data: any = {};
    for (const field of config.fields) {
      const raw = form.get(field.key);
      if (field.type === 'checkbox') data[field.key] = raw === 'on';
      else if (field.type === 'image') data[field.key] = draft[field.key] || (field.required ? undefined : '');
      else if (field.type === 'number') data[field.key] = Number(raw || 0);
      else if (field.type === 'datetime-local') {
        data[field.key] = raw ? new Date(String(raw)).toISOString() : null;
      } else if (resource === 'settings' && field.key === 'value') {
        try {
          data.value = JSON.parse(String(raw));
        } catch {
          return toast.error('Giá trị JSON không hợp lệ');
        }
      } else if (raw) data[field.key] = raw;
    }
    if (resource === 'banners' && !data.imageUrl) return toast.error('Vui lòng chọn ảnh banner');
    if (resource === 'home-sections') {
      data.categoryId = form.get('categoryId') ? Number(form.get('categoryId')) : null;
      data.settings = {
        ...(editing?.settings && typeof editing.settings === 'object' ? editing.settings : {}),
        eyebrow: String(form.get('eyebrow') || ''),
        body: String(form.get('body') || ''),
        ctaText: String(form.get('ctaText') || ''),
        ctaUrl: String(form.get('ctaUrl') || ''),
        imageUrl: draft.sectionImageUrl ?? editing?.settings?.imageUrl ?? '',
      };
    }
    saveInFlightRef.current = true;
    save.mutate(data);
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <span>QUẢN LÝ NỘI DUNG</span>
          <h1>{config.title}</h1>
          <p>Thêm, chỉnh sửa và sắp xếp dữ liệu hiển thị.</p>
        </div>
        {resource !== 'audit-logs' && (
          <button
            className="button navy"
            onClick={(event) => {
              dialogTriggerRef.current = event.currentTarget;
              setEditing(null);
              setDraft({});
              setOpen(true);
            }}
          >
            <Plus /> Thêm mới
          </button>
        )}
      </div>
      <HomepagePlacementGuide resource={resource} sample={q.data?.[0] || {}} />
      <div className="admin-card table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {q.data?.map((item: any) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>
                  <b>{item.title || item.name || item.key || item.action}</b>
                  <small>{item.slug || item.location || item.group || item.createdAt}</small>
                </td>
                <td>
                  <span className="status">
                    {item.isActive === false || item.isVisible === false ? 'Ẩn' : 'Hoạt động'}
                  </span>
                </td>
                <td>
                  <button
                    aria-label={`Chỉnh sửa ${item.title || item.name || item.key || item.action || `mục #${item.id}`}`}
                    onClick={(event) => {
                      dialogTriggerRef.current = event.currentTarget;
                      setEditing(item);
                      setDraft(item);
                      setOpen(true);
                    }}
                  >
                    <Edit3 />
                  </button>
                  <button
                    className="danger"
                    aria-label={`Xóa ${item.title || item.name || item.key || item.action || `mục #${item.id}`}`}
                    onClick={() => confirm('Bạn chắc chắn muốn xóa?') && remove.mutate(item.id)}
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!q.data?.length && <div className="empty-state">Chưa có dữ liệu.</div>}
      </div>
      <AdminDialog
        open={open}
        title={editing ? `Chỉnh sửa ${config.title}` : `Thêm ${config.title}`}
        busy={save.isPending}
        returnFocusRef={dialogTriggerRef}
        onClose={() => setOpen(false)}
      >
        <form
          onSubmit={submit}
          onChange={(event) => {
            const target = event.target as unknown as
              HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (!target.name) return;
            setDraft((current) => ({
              ...current,
              [target.name]:
                target instanceof HTMLInputElement && target.type === 'checkbox'
                  ? target.checked
                  : target.value,
            }));
          }}
        >
          <HomepagePlacementGuide resource={resource} sample={draft} compact />
          {config.fields.map((field) => field.type === 'image' ? (
            <MediaPicker key={field.key} label={field.label} value={draft[field.key]} folder={resource === 'banners' ? 'banners' : 'general'} onChange={(url) => setDraft((current) => ({ ...current, [field.key]: url }))} />
          ) : (
            <label key={field.key} className={field.type === 'checkbox' ? 'check-field' : ''}>
              {field.type === 'checkbox' ? (
                <>
                  <input
                    name={field.key}
                    type="checkbox"
                    defaultChecked={editing?.[field.key] ?? true}
                  />{' '}
                  {field.label}
                </>
              ) : (
                <>
                  {field.label}
                  {field.key === 'componentType' ? (
                    <select name={field.key} defaultValue={editing?.componentType || 'GRID'}><option value="GRID">Lưới</option><option value="LIST">Danh sách</option><option value="FEATURED">Nổi bật</option><option value="SLIDER">Thanh trượt</option></select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.key}
                      rows={5}
                      required={field.required}
                      defaultValue={
                        typeof editing?.[field.key] === 'object'
                          ? JSON.stringify(editing[field.key], null, 2)
                          : editing?.[field.key]
                      }
                    />
                  ) : (
                    <input
                      name={field.key}
                      type={field.type || 'text'}
                      required={field.required}
                      min={field.key === 'displayLimit' ? 1 : undefined}
                      max={field.key === 'displayLimit' ? 30 : undefined}
                      defaultValue={
                        field.type === 'datetime-local' && editing?.[field.key]
                          ? new Date(new Date(editing[field.key]).getTime() - new Date(editing[field.key]).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
                          : editing?.[field.key] ?? (field.key === 'displayLimit' ? 6 : undefined)
                      }
                    />
                  )}
                </>
              )}
            </label>
          ))}
          {resource === 'home-sections' && <div className="cms-section-fields">
            <label>Chuyên mục bài viết<select name="categoryId" defaultValue={editing?.categoryId || ''}><option value="">Không lọc</option>{categories.data?.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Dòng dẫn<input name="eyebrow" defaultValue={editing?.settings?.eyebrow || ''} /></label>
            <label>Đoạn giới thiệu<textarea name="body" rows={3} defaultValue={editing?.settings?.body || ''} /></label>
            <label>Chữ trên nút<input name="ctaText" defaultValue={editing?.settings?.ctaText || ''} /></label>
            <label>Đường dẫn nút<input name="ctaUrl" defaultValue={editing?.settings?.ctaUrl || ''} /></label>
            <MediaPicker label="Ảnh section" value={draft.sectionImageUrl ?? editing?.settings?.imageUrl} onChange={(url) => setDraft((current) => ({ ...current, sectionImageUrl: url }))} />
          </div>}
          {resource === 'banners' && <div className="cms-banner-preview" style={{ backgroundImage: draft.imageUrl ? `url("${draft.imageUrl}")` : undefined }} aria-label="Xem trước banner">
            <div><small>Xem trước banner</small><h2>{draft.title || 'Tiêu đề banner'}</h2><p>{draft.subtitle}</p><span>{draft.primaryText}</span>{draft.secondaryText && <span>{draft.secondaryText}</span>}</div>
          </div>}
          <div className="modal-actions">
            <button
              type="button"
              className="button outline"
              disabled={save.isPending}
              onClick={() => setOpen(false)}
            >
              Hủy
            </button>
            <button className="button navy" disabled={save.isPending}>
              {save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}
