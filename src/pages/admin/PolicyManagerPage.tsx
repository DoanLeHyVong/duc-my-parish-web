import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';

type Revision = { revision: number; status: 'DRAFT' | 'PUBLISHED'; title: string; createdAt: string; publishedAt?: string };
type Policy = { id: string; kind: string | null; slug: string; title: string; isActive: boolean; updatedAt: string; revisions: Revision[] };
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
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [customContent, setCustomContent] = useState('');
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
      const content = window.prompt(`Nhập nội dung ban đầu cho ${definition[2]}:`);
      if (!content?.trim()) return;
      await api.post('/admin/policies', { kind: definition[0], slug: definition[1], title: definition[2], contentHtml: `<p>${content.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>` });
      await load();
      toast.success('Đã tạo chính sách ở trạng thái dự thảo.');
    } catch (error: any) { toast.error(error.response?.data?.message ?? 'Không thể tạo chính sách.'); }
    finally { setBusy(false); }
  };
  const createCustom = async () => {
    if (!customTitle.trim() || !customSlug.trim() || !customContent.trim()) { toast.error('Nhập tên, đường dẫn và nội dung.'); return; }
    setBusy(true);
    try {
      const contentHtml = `<p>${customContent.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`;
      await api.post('/admin/policies', { kind: null, slug: customSlug, title: customTitle, contentHtml });
      setCustomTitle(''); setCustomSlug(''); setCustomContent(''); await load();
      toast.success('Đã tạo chính sách nháp.');
    } catch (error: any) { toast.error(error.response?.data?.message ?? 'Không thể tạo chính sách.'); }
    finally { setBusy(false); }
  };
  const toggle = async (policy: Policy) => {
    if (policy.isActive && !window.confirm(`Ẩn “${policy.title}” khỏi website và ứng dụng?`)) return;
    setBusy(true);
    try {
      await api.patch(`/admin/policies/${policy.slug}/visibility`, { isActive: !policy.isActive });
      await load(); toast.success(policy.isActive ? 'Đã ẩn chính sách.' : 'Đã bật hiển thị.');
    } catch (error: any) { toast.error(error.response?.data?.message ?? 'Không thể thay đổi trạng thái.'); }
    finally { setBusy(false); }
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

  const addLink = () => {
    if (!editor) return;
    const value = window.prompt('Nhập liên kết HTTPS hoặc HTTP:');
    if (!value) return;
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('scheme');
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.toString() }).run();
    } catch { toast.error('Liên kết phải là URL HTTP hoặc HTTPS hợp lệ.'); }
  };

  return <section>
    <div className="admin-title"><div><span>TRANG PHÁP LÝ CÔNG KHAI</span><h1>Chính sách</h1><p>Dự thảo và lịch sử chỉ hiển thị trong quản trị. URL công khai luôn đọc phiên bản đã công bố mới nhất.</p></div></div>
    <div className="admin-card policy-table-wrap"><table className="policy-table"><thead><tr><th>Tên</th><th>Slug</th><th>Trạng thái</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.title}</td><td>/{item.slug}</td><td>{item.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</td><td>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</td><td><button type="button" onClick={() => setSelected(item)}>Chỉnh sửa</button><label className="policy-switch"><input type="checkbox" checked={item.isActive} disabled={busy || (item.isActive && item.kind !== null)} onChange={() => void toggle(item)} aria-label={`Hiển thị ${item.title}`} /> Hiển thị</label></td></tr>)}</tbody></table>{items.length === 0 && <p>Chưa có chính sách.</p>}</div>
    <div className="admin-card policy-new"><h2>Tạo chính sách khác</h2><p>Bản mới ở trạng thái nháp và chưa hiển thị công khai.</p><div className="profile-fields"><label>Tên<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} /></label><label>Slug<input value={customSlug} onChange={(event) => setCustomSlug(event.target.value)} /></label></div><label>Nội dung ban đầu<textarea rows={4} value={customContent} onChange={(event) => setCustomContent(event.target.value)} /></label><button type="button" className="button navy" disabled={busy} onClick={() => void createCustom()}>Tạo bản nháp</button></div>
    {missing.length > 0 && <div className="admin-card policy-bootstrap"><b>Tạo chính sách còn thiếu:</b>{missing.map((item) => <button className="button outline" disabled={busy} key={item[0]} onClick={() => void createPolicy(item)}>{item[2]}</button>)}</div>}
    <div className="policy-admin-grid">
      <aside className="admin-card">{items.map((item) => <button className={selected?.id === item.id ? 'active' : ''} key={item.id} onClick={() => setSelected(item)}><b>{item.title}</b><small>/{item.slug}</small></button>)}</aside>
      <div>
        {selected ? <div className="admin-card policy-editor">
          <label>Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <div className="editor-toolbar"><button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'active' : ''}>Đậm</button><button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button><button onClick={() => editor?.chain().focus().toggleBulletList().run()}>Danh sách</button><button type="button" onClick={addLink}>Liên kết</button></div>
          <EditorContent editor={editor} />
          <button className="button navy" disabled={busy} onClick={() => void saveDraft()}>Lưu thành phiên bản dự thảo mới</button>
        </div> : <div className="admin-card">Chọn hoặc tạo một chính sách.</div>}
        {selected && <div className="admin-card policy-history"><h2>Lịch sử phiên bản</h2>{selected.revisions.map((revision) => <div key={revision.revision}><span><b>v{revision.revision} · {revision.title}</b><small>{revision.status} · {new Date(revision.publishedAt ?? revision.createdAt).toLocaleString('vi-VN')}</small></span>{revision.status === 'DRAFT' && <button className="button outline" disabled={busy} onClick={() => void publish(revision.revision)}>Công bố</button>}</div>)}</div>}
      </div>
    </div>
  </section>;
}
