import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, UserRoundCog } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import { AdminDialog } from '../../components/admin/AdminDialog';
import { useAuth, type RoleCode } from '../../providers/auth-context';

type AccessUser = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  isActive: boolean;
  roles: RoleCode[];
};
type Role = { code: RoleCode; name: string; permissions: string[]; userCount: number };
type CreateDraft = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  roles: RoleCode[];
};

const emptyDraft = (): CreateDraft => ({
  displayName: '',
  username: '',
  email: '',
  password: '',
  roles: [],
});
const usernamePattern = /^[A-Za-z0-9._-]{3,64}$/;
const roleCopy: Record<RoleCode, { name: string; description: string }> = {
  SUPER_ADMIN: {
    name: 'Quản trị toàn hệ thống',
    description: 'Quản lý bảo mật và toàn bộ khu vực quản trị.',
  },
  PARISH_ADMIN: {
    name: 'Quản trị website giáo xứ',
    description: 'Quản lý nội dung, lịch và thông tin trên website giáo xứ.',
  },
  APPGLV_ADMIN: {
    name: 'Quản trị AppGLV',
    description: 'Quản lý dữ liệu và hoạt động của ứng dụng giáo lý.',
  },
  TEACHER: {
    name: 'Giáo lý viên',
    description: 'Thực hiện các công việc giáo lý trong phạm vi được phân công.',
  },
};

function roleDetails(role: Role) {
  return (
    roleCopy[role.code] ?? {
      name: role.name || role.code,
      description: 'Vai trò quản trị được phân công cho tài khoản.',
    }
  );
}

function validateDraft(draft: CreateDraft): string | null {
  if (draft.displayName.trim().length < 2 || draft.displayName.trim().length > 120)
    return 'Họ tên hiển thị phải có từ 2 đến 120 ký tự.';
  if (!usernamePattern.test(draft.username.trim()))
    return 'Tên đăng nhập phải có 3–64 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  if (draft.email.trim().length > 191) return 'Email không được dài quá 191 ký tự.';
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
    return 'Email chưa đúng định dạng.';
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
  const [roleUser, setRoleUser] = useState<AccessUser | null>(null);
  const [roleDraft, setRoleDraft] = useState<RoleCode[]>([]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const createFormId = useRef(0);
  const activeCreateAttempt = useRef<symbol | null>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const query = useQuery({
    queryKey: ['security-access'],
    queryFn: async () => {
      const [users, roles] = await Promise.all([
        api.get('/admin/security/users'),
        api.get('/admin/security/roles'),
      ]);
      return { users: users.data.data as AccessUser[], roles: roles.data.data as Role[] };
    },
  });

  const updateRoles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleUser || saving) return;
    if (!roleDraft.length) {
      setRoleError('Mỗi tài khoản phải có ít nhất một vai trò.');
      return;
    }
    setRoleError(null);
    setSaving(roleUser.id);
    try {
      await api.put(`/admin/security/users/${roleUser.id}/roles`, { roles: roleDraft });
      await queryClient.invalidateQueries({ queryKey: ['security-access'] });
      toast.success('Đã cập nhật vai trò và vô hiệu hóa các phiên cũ.');
      setRoleUser(null);
    } catch (error: any) {
      const message = error.response?.data?.error?.message ?? 'Không thể cập nhật vai trò.';
      setRoleError(message);
      toast.error(message);
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
      const message =
        error.response?.data?.error?.message ?? 'Không thể tạo tài khoản. Vui lòng thử lại.';
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

  return (
    <section className="access-page">
      <div className="admin-title">
        <div>
          <span>BẢO MẬT TẬP TRUNG</span>
          <h1>Tài khoản & vai trò</h1>
          <p>
            Xem nhanh người dùng có thể làm gì và chỉ áp dụng thay đổi sau khi bạn kiểm tra, xác
            nhận lưu.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            className="button navy"
            type="button"
            disabled={creating}
            onClick={(event) => {
              dialogTriggerRef.current = event.currentTarget;
              openCreate();
            }}
          >
            <Plus /> Tạo tài khoản
          </button>
        )}
      </div>
      <div className="access-intro admin-card">
        <KeyRound aria-hidden="true" />
        <div>
          <strong>Phân quyền dễ hiểu, thay đổi có chủ đích</strong>
          <p>
            Mỗi tài khoản có thể giữ nhiều vai trò. Mở phần chỉnh sửa để xem lại lựa chọn trước khi
            lưu.
          </p>
        </div>
      </div>
      <div className="access-grid">
        {query.data.users.map((user) => (
          <article className="admin-card access-user" key={user.id}>
            <div className="access-identity">
              <div className="access-avatar" aria-hidden="true">
                {user.displayName.trim().charAt(0).toUpperCase() || <UserRoundCog />}
              </div>
              <div>
                <strong>{user.displayName}</strong>
                <small>@{user.username}</small>
                {user.email && <small>{user.email}</small>}
                <span className={`account-state ${user.isActive ? '' : 'inactive'}`}>
                  {user.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </div>
            <div className="access-role-summary">
              <span>Vai trò đang được giao</span>
              <div className="role-chips">
                {user.roles.map((code) => (
                  <span className="role-chip" key={code}>
                    {roleCopy[code]?.name ?? code}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="button outline access-edit-button"
              type="button"
              onClick={(event) => {
                dialogTriggerRef.current = event.currentTarget;
                setRoleUser(user);
                setRoleDraft([...user.roles]);
                setRoleError(null);
              }}
            >
              Chỉnh sửa vai trò
            </button>
          </article>
        ))}
      </div>

      <AdminDialog
        open={Boolean(roleUser)}
        title={`Chỉnh sửa vai trò${roleUser ? ` · ${roleUser.displayName}` : ''}`}
        busy={saving === roleUser?.id}
        returnFocusRef={dialogTriggerRef}
        onClose={() => setRoleUser(null)}
      >
        {roleUser && (
          <form className="access-role-form" onSubmit={(event) => void updateRoles(event)}>
            <p className="form-help">
              Kiểm tra vai trò và mục đích sử dụng. Thay đổi chỉ được gửi khi bạn chọn “Lưu vai
              trò”.
            </p>
            {roleError && (
              <p className="form-error" role="alert">
                {roleError}
              </p>
            )}
            <fieldset className="access-role-fieldset">
              <legend>Vai trò của tài khoản</legend>
              <div className="role-options">
                {query.data.roles
                  .filter(
                    (role) => role.code !== 'SUPER_ADMIN' || roleUser.roles.includes('SUPER_ADMIN'),
                  )
                  .map((role) => {
                    const details = roleDetails(role);
                    const selected = roleDraft.includes(role.code);
                    const immutable = role.code === 'SUPER_ADMIN';
                    return (
                      <label key={role.code} className={immutable ? 'role-immutable' : ''}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={immutable || saving === roleUser.id}
                          onChange={() =>
                            setRoleDraft((current) =>
                              selected
                                ? current.filter((item) => item !== role.code)
                                : [...current, role.code],
                            )
                          }
                        />
                        <span>
                          <b>{details.name}</b>
                          <small>{details.description}</small>
                          <code>{role.code}</code>
                        </span>
                      </label>
                    );
                  })}
              </div>
            </fieldset>
            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                disabled={saving === roleUser.id}
                onClick={() => setRoleUser(null)}
              >
                Hủy
              </button>
              <button className="button navy" disabled={saving === roleUser.id}>
                {saving === roleUser.id ? 'Đang lưu…' : 'Lưu vai trò'}
              </button>
            </div>
          </form>
        )}
      </AdminDialog>

      <AdminDialog
        open={createOpen}
        title="Tạo tài khoản"
        busy={creating}
        returnFocusRef={dialogTriggerRef}
        className="access-create-dialog"
        onClose={closeCreate}
      >
        <form
          className="access-create-form"
          noValidate
          onSubmit={(event) => void submitCreate(event)}
        >
          <p className="form-help">Tạo tài khoản quản lý với mật khẩu ban đầu do bạn cung cấp.</p>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}
          <div className="access-form-grid">
            <label>
              Họ tên hiển thị
              <input
                name="displayName"
                autoComplete="name"
                autoFocus
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>
            <label>
              Tên đăng nhập
              <input
                name="username"
                autoComplete="username"
                value={draft.username}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, username: event.target.value }))
                }
              />
            </label>
          </div>
          <label>
            Email (không bắt buộc)
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label>
            Mật khẩu ban đầu
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              value={draft.password}
              onChange={(event) =>
                setDraft((current) => ({ ...current, password: event.target.value }))
              }
            />
            <small className="field-help">
              Từ 12 đến 72 byte UTF-8. Mật khẩu sẽ được xóa khỏi biểu mẫu sau mỗi lần gửi.
            </small>
          </label>
          <fieldset className="access-role-fieldset">
            <legend>Vai trò</legend>
            <div className="role-options">
              {managedRoles.map((role) => {
                const details = roleDetails(role);
                return (
                  <label key={role.code}>
                    <input
                      type="checkbox"
                      checked={draft.roles.includes(role.code)}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          roles: current.roles.includes(role.code)
                            ? current.roles.filter((item) => item !== role.code)
                            : [...current.roles, role.code],
                        }))
                      }
                    />
                    <span>
                      <b>{details.name}</b>
                      <small>{details.description}</small>
                      <code>{role.code}</code>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="modal-actions">
            <button
              type="button"
              className="button outline"
              disabled={creating}
              onClick={closeCreate}
            >
              Hủy
            </button>
            <button className="button navy" disabled={creating}>
              {creating ? 'Đang tạo…' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </AdminDialog>
    </section>
  );
}
