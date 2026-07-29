import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoadingState } from './components/common/LoadingState';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/public/HomePage';

const load = <T extends Record<string, unknown>>(factory: () => Promise<T>, name: keyof T) =>
  lazy(() => factory().then((module) => ({ default: module[name] as ComponentType<any> })));
const content = () => import('./pages/public/ContentPages');
const ArticlePage = load(content, 'ArticlePage');
const CategoryPage = load(content, 'CategoryPage');
const SearchPage = load(content, 'SearchPage');
const MassPage = load(content, 'MassPage');
const EventsPage = load(content, 'EventsPage');
const LibraryPage = load(content, 'LibraryPage');
const AboutPage = load(content, 'AboutPage');
const ContactPage = load(content, 'ContactPage');
const NotFoundPage = load(content, 'NotFoundPage');
const DashboardPage = load(() => import('./pages/admin/DashboardPage'), 'DashboardPage');
const GenericManagerPage = load(() => import('./pages/admin/GenericManagerPage'), 'GenericManagerPage');
const LoginPage = load(() => import('./pages/admin/LoginPage'), 'LoginPage');
const MediaPage = load(() => import('./pages/admin/MediaPage'), 'MediaPage');
const MenuManagerPage = load(() => import('./pages/admin/MenuManagerPage'), 'MenuManagerPage');
const PostEditorPage = load(() => import('./pages/admin/PostEditorPage'), 'PostEditorPage');
const PostsPage = load(() => import('./pages/admin/PostsPage'), 'PostsPage');
const ProfilePage = load(() => import('./pages/admin/ProfilePage'), 'ProfilePage');

export default function App() {
  return <Suspense fallback={<LoadingState />}><Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="bai-viet/:slug" element={<ArticlePage />} />
      <Route path="chuyen-muc/:slug" element={<CategoryPage />} />
      <Route path="tim-kiem" element={<SearchPage />} />
      <Route path="gio-le" element={<MassPage />} />
      <Route path="su-kien" element={<EventsPage />} />
      <Route path="thu-vien" element={<LibraryPage />} />
      <Route path="gioi-thieu" element={<AboutPage />} />
      <Route path="lien-he" element={<ContactPage />} />
    </Route>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/new" element={<PostEditorPage />} />
        <Route path="posts/:id/edit" element={<PostEditorPage />} />
        <Route path="categories" element={<GenericManagerPage resource="categories" />} />
        <Route path="tags" element={<GenericManagerPage resource="tags" />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="banners" element={<GenericManagerPage resource="banners" />} />
        <Route path="menus" element={<MenuManagerPage />} />
        <Route path="home-sections" element={<GenericManagerPage resource="home-sections" />} />
        <Route path="announcements" element={<GenericManagerPage resource="announcements" />} />
        <Route path="mass-schedules" element={<GenericManagerPage resource="mass-schedules" />} />
        <Route path="events" element={<GenericManagerPage resource="events" />} />
        <Route path="albums" element={<GenericManagerPage resource="albums" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<GenericManagerPage resource="settings" />} />
        <Route path="audit-logs" element={<GenericManagerPage resource="audit-logs" />} />
      </Route>
    </Route>
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes></Suspense>;
}
