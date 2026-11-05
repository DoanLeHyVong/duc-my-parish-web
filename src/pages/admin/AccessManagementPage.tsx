import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../apis/client';
import type { RoleCode } from '../../providers/auth-context';

type AccessUser = { id: string; username: string; displayName: string; email?: string; isActive: boolean; roles: RoleCode[] };
type Role = { code: RoleCode; name: string; permissions: string[]; userCount: number };

export function AccessManagementPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
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

  if (query.isLoading) return <p>Đang tải tài khoản…</p>;
  if (query.isError || !query.data) return <p>Không thể tải dữ liệu phân quyền.</p>;
  return <section>
    <div className="admin-title"><div><span>BẢO MẬT TẬP TRUNG</span><h1>Tài khoản & vai trò</h1><p>Một tài khoản có thể giữ nhiều vai trò. Quyền hiệu lực là hợp của các vai trò được chọn.</p></div></div>
    <div className="access-grid">
      {query.data.users.map((user) => <article className="admin-card access-user" key={user.id}>
        <div><strong>{user.displayName}</strong><small>{user.username}{user.email ? ` · ${user.email}` : ''}</small></div>
        <div className="role-options">{query.data.roles.map((role) => {
          const selected = user.roles.includes(role.code);
          return <label key={role.code}><input type="checkbox" checked={selected} disabled={saving === user.id} onChange={() => {
            const next = selected ? user.roles.filter((item) => item !== role.code) : [...user.roles, role.code];
            void updateRoles(user, next);
          }} /><span><b>{role.code}</b><small>{role.permissions.join(', ')}</small></span></label>;
        })}</div>
      </article>)}
    </div>
  </section>;
}
