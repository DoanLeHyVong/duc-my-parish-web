import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';

type Revision = { revision: number; status: 'DRAFT' | 'PUBLISHED'; title: string; createdAt: string; publishedAt?: string };
type Policy = { id: string; kind: string; slug: string; title: string; revisions: Revision[] };
const defaults = [
  ['PRIVACY', 'privacy-policy', 'Chính sách quyền riêng tư'],
  ['TERMS', 'terms-of-use', 'Điều khoản sử dụng'],
  ['SUPPORT', 'support', 'Hỗ trợ'],
  ['DATA_REQUEST', 'data-request', 'Yêu cầu dữ liệu'],
] as const;

export function PolicyManagerPage() {
  const [items, setItems] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const editor = useEditor({ extensions: [StarterKit], content: '<p></p>' });

  const load = async () => {
    const response = await api.get('/admin/policies');
    const policies = response.data.data as Policy[];
    setItems(policies);
    setSelected((current) => policies.find((item) => item.id === current?.id) ?? policies[0] ?? null);
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    const latest = selected.revisions[0];
    if (!latest) return;
    api.get(`/admin/policies/${selected.slug}/revisions/${latest.revision}`).then((response) => {
      editor?.commands.setContent(response.data.data.contentHtml);
      setTitle(response.data.data.title);
    });
  }, [selected, editor]);

  const missing = useMemo(() => defaults.filter(([kind]) => !items.some((item) => item.kind === kind)), [items]);

  const createPolicy = async (definition: typeof defaults[number]) => {
    setBusy(true);
    try {
      await api.post('/admin/policies', { kind: definition[0], slug: definition[1], title: definition[2], contentHtml: '<p>Nội dung dự thảo.</p>' });
      await load();
      toast.success('Đã tạo chính sách ở trạng thái dự thảo.');
    } finally { setBusy(false); }
  };

  const saveDraft = async () => {
    if (!selected || !editor) return;
    setBusy(true);
    try {
      await api.post(`/admin/policies/${selected.slug}/revisions`, { title, contentHtml: editor.getHTML() });
      await load();
      toast.success('Đã tạo phiên bản dự thảo mới.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message ?? 'Không thể lưu dự thảo.');
    } finally { setBusy(false); }
  };

  const publish = async (revision: number) => {
    if (!selected || !confirm(`Công bố phiên bản ${revision}? Phiên bản đã công bố là bất biến.`)) return;
    setBusy(true);
    try {
      await api.post(`/admin/policies/${selected.slug}/publish`, { revision });
      await load();
      toast.success('Đã công bố chính sách.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message ?? 'Không thể công bố.');
    } finally { setBusy(false); }
  };

  return <section>
    <div className="admin-title"><div><span>TRANG PHÁP LÝ CÔNG KHAI</span><h1>Chính sách</h1><p>Dự thảo và lịch sử chỉ hiển thị trong quản trị. URL công khai luôn đọc phiên bản đã công bố mới nhất.</p></div></div>
    {missing.length > 0 && <div className="admin-card policy-bootstrap"><b>Tạo chính sách còn thiếu:</b>{missing.map((item) => <button className="button outline" disabled={busy} key={item[0]} onClick={() => void createPolicy(item)}>{item[2]}</button>)}</div>}
    <div className="policy-admin-grid">
      <aside className="admin-card">{items.map((item) => <button className={selected?.id === item.id ? 'active' : ''} key={item.id} onClick={() => setSelected(item)}><b>{item.title}</b><small>/{item.slug}</small></button>)}</aside>
      <div>
        {selected ? <div className="admin-card policy-editor">
          <label>Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <div className="editor-toolbar"><button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'active' : ''}>Đậm</button><button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button><button onClick={() => editor?.chain().focus().toggleBulletList().run()}>Danh sách</button></div>
          <EditorContent editor={editor} />
          <button className="button navy" disabled={busy} onClick={() => void saveDraft()}>Lưu thành phiên bản dự thảo mới</button>
        </div> : <div className="admin-card">Chọn hoặc tạo một chính sách.</div>}
        {selected && <div className="admin-card policy-history"><h2>Lịch sử phiên bản</h2>{selected.revisions.map((revision) => <div key={revision.revision}><span><b>v{revision.revision} · {revision.title}</b><small>{revision.status} · {new Date(revision.publishedAt ?? revision.createdAt).toLocaleString('vi-VN')}</small></span>{revision.status === 'DRAFT' && <button className="button outline" disabled={busy} onClick={() => void publish(revision.revision)}>Công bố</button>}</div>)}</div>}
      </div>
    </div>
  </section>;
}
