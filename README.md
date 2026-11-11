# Giáo xứ Đức Mỹ — React website

> Current deployment: `main` and pull requests targeting `main` run CI only; reviewed `main` static artifacts are deployed manually to native Nginx via `deploy/manual/`. No Docker runtime or automatic VPS deployment is active.

## Chạy cùng unified API trên Windows

Khởi động `duc-my-parish-api` tại port `5000` trước. Trong terminal thứ hai:

```powershell
Set-Location D:\AppGLV\duc-my-parish-web
npm.cmd install
npm.cmd run dev
```

Vite chạy tại `http://localhost:5173` và proxy `/api` sang `http://127.0.0.1:5000`. Local config trong `.env.example` dùng `VITE_API_URL=/api/v1`; production có thể dùng URL HTTPS tuyệt đối của API. Web không chứa credential MySQL.

Xác minh Web và proxy sau khi cả hai process đã chạy:

```powershell
Invoke-WebRequest http://localhost:5173/
Invoke-WebRequest http://localhost:5173/api/v1/health
Invoke-WebRequest http://localhost:5173/api/v1/ready
```

Website công khai và trang quản trị dùng React, TypeScript, Vite, Tailwind CSS, TanStack Query và TipTap.

## Chạy local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

- Website: `http://localhost:5173`
- Admin: `http://localhost:5173/admin/login`
- Backend mặc định: `http://localhost:5000/api/v1`

React chỉ gọi Express REST API; không kết nối trực tiếp XAMPP/MySQL.

## Cấu hình

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SITE_URL=http://localhost:5173
```

Màu sắc, font và responsive rules nằm trong `src/index.css`. Các biến màu ở đầu file giúp thay theme tập trung.

## Kiểm tra và build

```powershell
npm run lint
npm run test
npm run build
npm run preview
```

## Triển khai Vercel

Import repository vào Vercel với framework Vite, build command `npm run build` và output directory `dist`. Đặt `VITE_API_URL` thành HTTPS URL của Railway API (kèm `/api/v1`) và `VITE_SITE_URL` thành URL website. `vercel.json` xử lý fallback cho React Router; sitemap và robots được tạo theo `VITE_SITE_URL` trong lúc build.

Database production phải là MySQL/MariaDB managed hoặc database riêng trên server; XAMPP chỉ dành cho local development. React không chứa thông tin database hay Cloudinary secret.
