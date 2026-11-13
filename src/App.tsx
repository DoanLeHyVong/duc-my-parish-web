import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { PermissionRoute, ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoadingState } from './components/common/LoadingState';
import { PageSeo } from './components/common/SiteSeo';
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
const EventDetailPage = load(content, 'EventDetailPage');
const LibraryPage = load(content, 'LibraryPage');
const AlbumDetailPage = load(content, 'AlbumDetailPage');
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

function LegacyPublicRedirect({ to, dynamic = false }: { to: string; dynamic?: boolean }) {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  const destination = dynamic && slug ? `${to}/${encodeURIComponent(slug)}` : to;
  return <Navigate to={`${destination}${search}${hash}`} replace />;
}

export default function App() {
  return <><PageSeo /><Suspense fallback={<LoadingState />}><Routes>
    <Route path="/privacy.html" element={<LegacyPublicRedirect to="/privacy" />} />
    <Route path="/terms.html" element={<LegacyPublicRedirect to="/terms" />} />
    <Route path="/support.html" element={<LegacyPublicRedirect to="/support" />} />
    <Route path="/data-request.html" element={<LegacyPublicRedirect to="/data-request" />} />
    <Route path="/gioi-thieu" element={<LegacyPublicRedirect to="/about" />} />
    <Route path="/gio-le" element={<LegacyPublicRedirect to="/mass-schedule" />} />
    <Route path="/su-kien" element={<LegacyPublicRedirect to="/events" />} />
    <Route path="/thu-vien" element={<LegacyPublicRedirect to="/gallery" />} />
    <Route path="/lien-he" element={<LegacyPublicRedirect to="/contact" />} />
    <Route path="/tim-kiem" element={<LegacyPublicRedirect to="/search" />} />
    <Route path="/quyen-rieng-tu" element={<LegacyPublicRedirect to="/privacy" />} />
    <Route path="/dieu-khoan-su-dung" element={<LegacyPublicRedirect to="/terms" />} />
    <Route path="/ho-tro" element={<LegacyPublicRedirect to="/support" />} />
    <Route path="/yeu-cau-du-lieu" element={<LegacyPublicRedirect to="/data-request" />} />
    <Route path="/bai-viet/:slug" element={<LegacyPublicRedirect to="/posts" dynamic />} />
    <Route path="/chuyen-muc/:slug" element={<LegacyPublicRedirect to="/categories" dynamic />} />
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="posts/:slug" element={<ArticlePage />} />
      <Route path="categories/:slug" element={<CategoryPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="mass-schedule" element={<MassPage />} />
      <Route path="events" element={<EventsPage />} />
      <Route path="events/:slug" element={<EventDetailPage />} />
      <Route path="gallery" element={<LibraryPage />} />
      <Route path="gallery/:id" element={<AlbumDetailPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="privacy" element={<PolicyPage slug="privacy-policy" />} />
      <Route path="terms" element={<PolicyPage slug="terms-of-use" />} />
      <Route path="support" element={<PolicyPage slug="support" />} />
      <Route path="data-request" element={<PolicyPage slug="data-request" />} />
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
  </Routes></Suspense></>;
}
