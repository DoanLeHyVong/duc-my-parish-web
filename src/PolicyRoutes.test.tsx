import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import vercelConfig from '../vercel.json';
import App from './App';

vi.mock('./layouts/PublicLayout', () => ({ PublicLayout: () => <Outlet /> }));
vi.mock('./components/common/SiteSeo', () => ({ PageSeo: () => null }));
vi.mock('./pages/public/PolicyPage', () => ({
  PolicyPage: ({ slug }: { slug: string }) => <div>{slug}</div>,
}));
vi.mock('./pages/public/HomePage', () => ({ HomePage: () => <div>home</div> }));
vi.mock('./pages/public/ContentPages', () => ({
  ArticlePage: () => <div>article</div>,
  CategoryPage: () => <div>category</div>,
  SearchPage: () => <div>search</div>,
  MassPage: () => <div>mass</div>,
  EventsPage: () => <div>events</div>,
  EventDetailPage: () => <div>event-detail</div>,
  LibraryPage: () => <div>gallery</div>,
  AboutPage: () => <div>about</div>,
  ContactPage: () => <div>contact</div>,
  NotFoundPage: () => <div>not-found</div>,
}));

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
  );
}

describe('public routes', () => {
  it.each([
    ['/about', 'about'],
    ['/mass-schedule', 'mass'],
    ['/events', 'events'],
    ['/events/sinh-hoat-thu-nghiem', 'event-detail'],
    ['/gallery', 'gallery'],
    ['/contact', 'contact'],
    ['/search', 'search'],
    ['/posts/a-content-slug', 'article'],
    ['/categories/parish-news', 'category'],
    ['/privacy', 'privacy-policy'],
    ['/terms', 'terms-of-use'],
    ['/support', 'support'],
    ['/data-request', 'data-request'],
  ])('serves canonical route %s', async (path, content) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(content)).toBeInTheDocument();
  });

  it.each([
    ['/gioi-thieu', '/about'],
    ['/gio-le', '/mass-schedule'],
    ['/su-kien', '/events'],
    ['/thu-vien', '/gallery'],
    ['/lien-he', '/contact'],
    ['/tim-kiem', '/search'],
    ['/bai-viet/giu-nguyen-slug', '/posts/giu-nguyen-slug'],
    ['/chuyen-muc/giu-nguyen-slug', '/categories/giu-nguyen-slug'],
    ['/quyen-rieng-tu', '/privacy'],
    ['/dieu-khoan-su-dung', '/terms'],
    ['/ho-tro', '/support'],
    ['/yeu-cau-du-lieu', '/data-request'],
    ['/privacy.html', '/privacy'],
    ['/terms.html', '/terms'],
    ['/support.html', '/support'],
    ['/data-request.html', '/data-request'],
  ])('redirects legacy route %s and preserves its URL suffix', async (path, destination) => {
    render(
      <MemoryRouter initialEntries={[`${path}?from=bookmark#section`]}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('location')).toHaveTextContent(
      `${destination}?from=bookmark#section`,
    );
  });

  it.each([
    ['/bai-viet/phan%2Fmot', '/posts/phan%2Fmot'],
    ['/chuyen-muc/nhom%3Fdac-biet', '/categories/nhom%3Fdac-biet'],
  ])('keeps encoded delimiters inside a dynamic slug for %s', async (path, destination) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('location')).toHaveTextContent(destination);
  });

  it('declares the exact permanent deployment redirects', () => {
    expect(vercelConfig.redirects).toEqual([
      { source: '/gioi-thieu', destination: '/about', permanent: true },
      { source: '/gio-le', destination: '/mass-schedule', permanent: true },
      { source: '/su-kien', destination: '/events', permanent: true },
      { source: '/thu-vien', destination: '/gallery', permanent: true },
      { source: '/lien-he', destination: '/contact', permanent: true },
      { source: '/tim-kiem', destination: '/search', permanent: true },
      { source: '/bai-viet/:slug', destination: '/posts/:slug', permanent: true },
      { source: '/chuyen-muc/:slug', destination: '/categories/:slug', permanent: true },
      { source: '/quyen-rieng-tu', destination: '/privacy', permanent: true },
      { source: '/dieu-khoan-su-dung', destination: '/terms', permanent: true },
      { source: '/ho-tro', destination: '/support', permanent: true },
      { source: '/yeu-cau-du-lieu', destination: '/data-request', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/support.html', destination: '/support', permanent: true },
      { source: '/data-request.html', destination: '/data-request', permanent: true },
    ]);
  });
});
