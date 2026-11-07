import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { useAuth, type RoleCode } from '../../providers/auth-context';

type AccessUser = { id: string; username: string; displayName: string; email?: string; isActive: boolean; roles: RoleCode[] };
type Role = { code: RoleCode; name: string; permissions: string[]; userCount: number };
type CreateDraft = { displayName: string; username: string; email: string; password: string; roles: RoleCode[] };

const emptyDraft = (): CreateDraft => ({ displayName: '', username: '', email: '', password: '', roles: [] });
const usernamePattern = /^[A-Za-z0-9._-]{3,64}$/;

function validateDraft(draft: CreateDraft): string | null {
  if (draft.displayName.trim().length < 2 || draft.displayName.trim().length > 120) {
    return 'Họ tên hiển thị phải có từ 2 đến 120 ký tự.';
  }
  if (!usernamePattern.test(draft.username.trim())) {
    return 'Tên đăng nhập phải có 3–64 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  }
  if (draft.email.trim().length > 191) return 'Email không được dài quá 191 ký tự.';
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    return 'Email chưa đúng định dạng.';
  }
  const passwordBytes = new TextEncoder().encode(draft.password).length;
  if (passwordBytes < 12 || passwordBytes > 72) return 'Mật khẩu phải dài từ 12 đến 72 byte UTF-8.';
  if (!draft.roles.length) return 'Chọn ít nhất một vai trò.';
  return null;
}

export function AccessManagementPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const [saving, setSaving] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const createFormId = useRef(0);
  const activeCreateAttempt = useRef<symbol | null>(null);
  const query = useQuery({
    queryKey: ['security-access'],
    queryFn: async () => {
      const [users, roles] = await Promise.all([api.get('/admin/security/users'), api.get('/admin/security/roles')]);
      return { users: users.data.data as AccessUser[], roles: roles.data.data as Role[] };
    },
  });

  const updateRoles = async (user: AccessUser, roles: RoleCode[]) => {
    if (!roles.length) return toast.error('Mỗi tài khoản phải có ít nhất một vai trò.');
    setSaving(user.id);
    try {
      await api.put(`/admin/security/users/${user.id}/roles`, { roles });
      await queryClient.invalidateQueries({ queryKey: ['security-access'] });
      toast.success('Đã cập nhật vai trò và vô hiệu hóa các phiên cũ.');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message ?? 'Không thể cập nhật vai trò.');
    } finally {
      setSaving(null);
    }
  };

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeCreateAttempt.current) return;
    const password = draft.password;
    setDraft((current) => ({ ...current, password: '' }));
    setCreateError(null);
    const submitted = { ...draft, password };
    const validationError = validateDraft(submitted);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    const formId = createFormId.current;
    const attempt = Symbol('create-account');
    activeCreateAttempt.current = attempt;
    setCreating(true);
    try {
      await api.post('/admin/security/users', {
        displayName: submitted.displayName.trim(),
        username: submitted.username.trim().toLowerCase(),
        ...(submitted.email.trim() ? { email: submitted.email.trim().toLowerCase() } : {}),
        password,
        roles: submitted.roles,
      });
      await queryClient.invalidateQueries({ queryKey: ['security-access'] });
      if (activeCreateAttempt.current !== attempt || createFormId.current !== formId) return;
      toast.success('Đã tạo tài khoản quản lý.');
      setDraft(emptyDraft());
      setCreateOpen(false);
    } catch (error: any) {
      if (activeCreateAttempt.current !== attempt || createFormId.current !== formId) return;
      const message = error.response?.data?.error?.message ?? 'Không thể tạo tài khoản. Vui lòng thử lại.';
      setCreateError(message);
      toast.error(message);
    } finally {
      if (activeCreateAttempt.current === attempt) {
        activeCreateAttempt.current = null;
        if (createFormId.current === formId) setCreating(false);
      }
    }
  };

  const openCreate = () => {
    if (activeCreateAttempt.current) return;
    createFormId.current += 1;
    setDraft(emptyDraft());
    setCreateError(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (activeCreateAttempt.current) return;
    createFormId.current += 1;
    setCreateOpen(false);
  };

  if (query.isLoading) return <p>Đang tải tài khoản…</p>;
  if (query.isError || !query.data) return <p>Không thể tải dữ liệu phân quyền.</p>;
  const managedRoles = query.data.roles.filter((role) => role.code !== 'SUPER_ADMIN');

  return <section>
    <div className="admin-title"><div><span>BẢO MẬT TẬP TRUNG</span><h1>Tài khoản & vai trò</h1><p>Một tài khoản có thể giữ nhiều vai trò. Quyền hiệu lực là hợp của các vai trò được chọn.</p></div>{isSuperAdmin && <button className="button navy" type="button" disabled={creating} onClick={openCreate}><Plus /> Tạo tài khoản</button>}</div>
    <div className="access-grid">
      {query.data.users.map((user) => <article className="admin-card access-user" key={user.id}>
        <div><strong>{user.displayName}</strong><small>{user.username}{user.email ? ` · ${user.email}` : ''}</small></div>
        <div className="role-options">{query.data.roles.map((role) => {
          const selected = user.roles.includes(role.code);
          const immutable = role.code === 'SUPER_ADMIN';
          return <label key={role.code} className={immutable ? 'role-immutable' : ''}><input type="checkbox" checked={selected} disabled={saving === user.id || immutable} onChange={() => {
            const next = selected ? user.roles.filter((item) => item !== role.code) : [...user.roles, role.code];
            void updateRoles(user, next);
          }} /><span><b>{role.code}</b><small>{role.permissions.join(', ')}</small></span></label>;
        })}</div>
      </article>)}
    </div>
    {createOpen && <div className="modal-backdrop" role="presentation"><form className="admin-modal access-create-form" role="dialog" aria-modal="true" aria-labelledby="create-account-title" noValidate onSubmit={(event) => void submitCreate(event)}>
      <div><h2 id="create-account-title">Tạo tài khoản</h2><button type="button" aria-label="Đóng" disabled={creating} onClick={closeCreate}><X /></button></div>
      <p className="form-help">Tạo tài khoản quản lý với mật khẩu ban đầu do bạn cung cấp.</p>
      {createError && <p className="form-error" role="alert">{createError}</p>}
      <div className="access-form-grid">
        <label>Họ tên hiển thị<input name="displayName" autoComplete="name" autoFocus value={draft.displayName} onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))} /></label>
        <label>Tên đăng nhập<input name="username" autoComplete="username" value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))} /></label>
      </div>
      <label>Email (không bắt buộc)<input name="email" type="email" autoComplete="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></label>
      <label>Mật khẩu ban đầu<input name="password" type="password" autoComplete="new-password" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} /><small className="field-help">Từ 12 đến 72 byte UTF-8. Mật khẩu sẽ được xóa khỏi biểu mẫu sau mỗi lần gửi.</small></label>
      <fieldset className="access-role-fieldset"><legend>Vai trò</legend><div className="role-options">{managedRoles.map((role) => <label key={role.code}><input type="checkbox" checked={draft.roles.includes(role.code)} onChange={() => setDraft((current) => ({ ...current, roles: current.roles.includes(role.code) ? current.roles.filter((item) => item !== role.code) : [...current.roles, role.code] }))} /><span><b>{role.name || role.code}</b><small>{role.permissions.join(', ')}</small></span></label>)}</div></fieldset>
      <div className="modal-actions"><button type="button" className="button outline" disabled={creating} onClick={closeCreate}>Hủy</button><button className="button navy" disabled={creating}>{creating ? 'Đang tạo…' : 'Tạo tài khoản'}</button></div>
    </form></div>}
  </section>;
}
