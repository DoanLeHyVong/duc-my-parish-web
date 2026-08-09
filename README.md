# Giáo xứ Đức Mỹ — React website

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
