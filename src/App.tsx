import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PermissionRoute, ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoadingState } from './components/common/LoadingState';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { PolicyPage } from './pages/public/PolicyPage';

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
const AccessManagementPage = load(() => import('./pages/admin/AccessManagementPage'), 'AccessManagementPage');
const PolicyManagerPage = load(() => import('./pages/admin/PolicyManagerPage'), 'PolicyManagerPage');

const parishResources = [
  ['categories', <GenericManagerPage key="categories" resource="categories" />],
  ['tags', <GenericManagerPage key="tags" resource="tags" />],
  ['media', <MediaPage key="media" />],
  ['banners', <GenericManagerPage key="banners" resource="banners" />],
  ['menus', <MenuManagerPage key="menus" />],
  ['home-sections', <GenericManagerPage key="home-sections" resource="home-sections" />],
  ['announcements', <GenericManagerPage key="announcements" resource="announcements" />],
  ['mass-schedules', <GenericManagerPage key="mass-schedules" resource="mass-schedules" />],
  ['events', <GenericManagerPage key="events" resource="events" />],
  ['albums', <GenericManagerPage key="albums" resource="albums" />],
  ['profile', <ProfilePage key="profile" />],
  ['settings', <GenericManagerPage key="settings" resource="settings" />],
] as const;

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
      <Route path="quyen-rieng-tu" element={<PolicyPage slug="privacy-policy" />} />
      <Route path="dieu-khoan-su-dung" element={<PolicyPage slug="terms-of-use" />} />
      <Route path="ho-tro" element={<PolicyPage slug="support" />} />
      <Route path="yeu-cau-du-lieu" element={<PolicyPage slug="data-request" />} />
    </Route>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route element={<PermissionRoute permission="parish.manage" />}>
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:id/edit" element={<PostEditorPage />} />
          {parishResources.map(([path, element]) => <Route key={path} path={path} element={element} />)}
        </Route>
        <Route element={<PermissionRoute permission="policies.manage" />}><Route path="policies" element={<PolicyManagerPage />} /></Route>
        <Route element={<PermissionRoute permission="security.manage" />}><Route path="access" element={<AccessManagementPage />} /></Route>
      </Route>
    </Route>
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes></Suspense>;
}
