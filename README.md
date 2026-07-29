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

## Triển khai

Build thư mục `dist`, cấu hình web server fallback mọi route về `index.html`, đặt `VITE_API_URL` về HTTPS API production và cập nhật domain trong `robots.txt`, `sitemap.xml`. Database production phải là MySQL/MariaDB managed hoặc database riêng trên server; XAMPP chỉ dành cho local development.
