import { zodResolver } from '@hookform/resolvers/zod';
import { Church, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '../../providers/auth-context';

const schema = z.object({ username: z.string().trim().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'), password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự') });
type Input = z.infer<typeof schema>;

export function LoginPage() {
  const [show, setShow] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Input>({ resolver: zodResolver(schema) });
  const submit = async (values: Input) => {
    try { await login(values.username, values.password); toast.success('Đăng nhập thành công'); navigate((location.state as any)?.from?.pathname || '/admin'); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Không thể đăng nhập'); }
  };
  return <div className="login-page"><Helmet><title>Đăng nhập quản trị | Giáo xứ Đức Mỹ</title></Helmet><div className="login-visual"><div><Church /><span>GIÁO PHẬN BÀ RỊA</span><h1>Giáo xứ Đức Mỹ</h1><p>Hiệp nhất trong đức tin — Lan tỏa yêu thương</p></div></div><div className="login-panel"><form onSubmit={handleSubmit(submit)}><div className="login-mark">✝</div><span className="eyebrow">KHU VỰC QUẢN TRỊ</span><h2>Xin chào trở lại</h2><p>Đăng nhập để quản lý nội dung website.</p><label>Tên đăng nhập<div><UserRound /><input type="text" autoComplete="username" placeholder="nguyenhoangbuukim" {...register('username')} /></div>{errors.username && <small>{errors.username.message}</small>}</label><label>Mật khẩu<div><LockKeyhole /><input type={show ? 'text' : 'password'} autoComplete="current-password" {...register('password')} /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div>{errors.password && <small>{errors.password.message}</small>}</label><button className="button navy wide" disabled={isSubmitting}>{isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button><a href="/">← Về trang công khai</a></form></div></div>;
}
