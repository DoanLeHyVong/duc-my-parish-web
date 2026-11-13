import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { AdminDialog } from '../../components/admin/AdminDialog';
import { HomepagePlacementGuide } from '../../components/admin/HomepagePlacementGuide';

export function MenuManagerPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [menuDraft, setMenuDraft] = useState<any>({});
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [location, setLocation] = useState<'HEADER' | 'FOOTER'>('HEADER');
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const saveInFlightRef = useRef(false);
  const menus = useQuery({
    queryKey: ['admin', 'menus'],
    queryFn: () => api.get('/admin/menus').then((r) => r.data.data),
  });
  const items = useQuery({
    queryKey: ['admin', 'menu-items'],
    queryFn: () => api.get('/admin/menu-items?limit=100').then((r) => r.data.data),
  });
  const headerMenu = menus.data?.find((m: any) => m.location === location);
  const ordered = [...(items.data || [])]
    .filter((i: any) => i.menuId === headerMenu?.id)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  const save = useMutation({
    mutationFn: async (data: any) => {
      let menuId = headerMenu?.id;
      if (!menuId) {
        const created = await api.post('/admin/menus', { name: location === 'HEADER' ? 'Điều hướng chính' : 'Chân trang', location, isActive: true });
        menuId = created.data.data.id;
      }
      return editing ? api.put(`/admin/menu-items/${editing.id}`, { ...data, menuId }) : api.post('/admin/menu-items', { ...data, menuId });
    },
    onSuccess: () => {
      toast.success('Đã lưu menu');
      client.invalidateQueries({ queryKey: ['admin', 'menu-items'] });
      client.invalidateQueries({ queryKey: ['admin', 'menus'] });
      client.invalidateQueries({ queryKey: ['home'] });
      setOpen(false);
      setEditing(null);
    },
    onSettled: () => {
      saveInFlightRef.current = false;
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/menu-items/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'menu-items'] }),
  });
  const drop = async (event: DragEvent, targetId: number) => {
    event.preventDefault();
    if (!dragId || dragId === targetId) return;
    const from = ordered.findIndex((i: any) => i.id === dragId);
    const to = ordered.findIndex((i: any) => i.id === targetId);
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await Promise.all(
      next.map((item: any, sortOrder) => api.patch(`/admin/menu-items/${item.id}`, { sortOrder })),
    );
    setDragId(null);
    client.invalidateQueries({ queryKey: ['admin', 'menu-items'] });
    toast.success('Đã đổi thứ tự menu');
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveInFlightRef.current) return;
    const form = new FormData(e.currentTarget);
    saveInFlightRef.current = true;
    save.mutate({
      label: form.get('label'),
      url: form.get('url'),
      linkType: form.get('linkType'),
      target: form.get('target'),
      parentId: form.get('parentId') ? Number(form.get('parentId')) : null,
      sortOrder: editing?.sortOrder ?? ordered.length,
      isVisible: form.get('isVisible') === 'on',
    });
  };
  return (
    <>
      <div className="admin-title">
        <div>
          <span>ĐIỀU HƯỚNG WEBSITE</span>
          <h1>Menu</h1>
          <p>Kéo thả để đổi thứ tự; hỗ trợ menu cha/con và liên kết nội bộ/ngoài.</p>
        </div>
        <button
          className="button navy"
          onClick={(event) => {
            dialogTriggerRef.current = event.currentTarget;
            setEditing(null);
            setMenuDraft({ label: 'Mục menu mới' });
            setOpen(true);
          }}
        >
          <Plus /> Thêm mục menu
        </button>
      </div>
      <HomepagePlacementGuide resource="menus" sample={{ items: ordered }} />
      <label className="admin-card">Vị trí menu <select value={location} onChange={(event) => setLocation(event.target.value as 'HEADER' | 'FOOTER')}><option value="HEADER">Đầu trang</option><option value="FOOTER">Chân trang</option></select></label>
      <div className="admin-card menu-manager">
        {ordered.map((item: any) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e, item.id)}
          >
            <GripVertical />
            <span>
              <b>{item.label}</b>
              <small>
                {item.url} · {item.linkType}
              </small>
            </span>
            <i className="status">{item.isVisible ? 'Hiện' : 'Ẩn'}</i>
            <button
              aria-label={`Chỉnh sửa mục menu ${item.label}`}
              onClick={(event) => {
                dialogTriggerRef.current = event.currentTarget;
                setEditing(item);
                setMenuDraft(item);
                setOpen(true);
              }}
            >
              <Edit3 />
            </button>
            <button
              className="danger"
              aria-label={`Xóa mục menu ${item.label}`}
              onClick={() => confirm('Xóa mục menu này?') && remove.mutate(item.id)}
            >
              <Trash2 />
            </button>
          </div>
        ))}
      </div>
      <AdminDialog
        open={open}
        title={editing ? 'Chỉnh sửa mục menu' : 'Thêm mục menu'}
        busy={save.isPending}
        returnFocusRef={dialogTriggerRef}
        onClose={() => setOpen(false)}
      >
        <form
          onSubmit={submit}
          onChange={(event) => {
            const target = event.target as unknown as HTMLInputElement | HTMLSelectElement;
            if (target.name)
              setMenuDraft((current: any) => ({
                ...current,
                [target.name]:
                  target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value,
              }));
          }}
        >
          <HomepagePlacementGuide
            resource="menus"
            sample={{
              items: editing
                ? ordered.map((item: any) => (item.id === editing.id ? menuDraft : item))
                : [...ordered, menuDraft],
            }}
            compact
          />
          <label>
            Nhãn menu
            <input name="label" required defaultValue={editing?.label} />
          </label>
          <label>
            URL
            <input name="url" required defaultValue={editing?.url} />
          </label>
          <label>
            Loại liên kết
            <select name="linkType" defaultValue={editing?.linkType || 'INTERNAL'}>
              <option>INTERNAL</option>
              <option>EXTERNAL</option>
              <option>SECTION</option>
              <option>CATEGORY</option>
              <option>POST</option>
            </select>
          </label>
          <label>
            Menu cha
            <select name="parentId" defaultValue={editing?.parentId || ''}>
              <option value="">Không có</option>
              {ordered
                .filter((i: any) => i.id !== editing?.id)
                .map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Mở liên kết
            <select name="target" defaultValue={editing?.target || '_self'}>
              <option value="_self">Cùng cửa sổ</option>
              <option value="_blank">Cửa sổ mới</option>
            </select>
          </label>
          <label className="check-field">
            <input type="checkbox" name="isVisible" defaultChecked={editing?.isVisible ?? true} />{' '}
            Hiển thị
          </label>
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
              {save.isPending ? 'Đang lưu…' : 'Lưu menu'}
            </button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}
