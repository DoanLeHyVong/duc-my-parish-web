import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { publicApi } from '../../apis/public.api';
import type { HomeData } from '../../types';
import { HomePage } from './HomePage';

vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../apis/public.api', () => ({ publicApi: { home: vi.fn() } }));

afterEach(cleanup);

it('uses canonical English paths for source-controlled home navigation', async () => {
  const data: HomeData = {
    profile: {
      name: 'Giáo xứ Đức Mỹ',
      diocese: 'Bà Rịa',
      description: 'Mô tả',
      address: 'Địa chỉ',
    },
    banners: [],
    menu: null,
    sections: [],
    posts: [],
    announcements: [],
    massSchedules: [],
    events: [],
    albums: [],
  };
  vi.mocked(publicApi.home).mockResolvedValue(data);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );

  await screen.findByRole('heading', { level: 1 });
  const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
  for (const expected of [
    '/mass-schedule',
    '/categories/announcements',
    '/about',
    '/categories/parish-news',
    '/categories/daily-word',
    '/categories/diocese-news',
    '/categories/bible-study',
    '/categories/catechism',
    '/events',
    '/gallery',
    '/contact',
  ]) {
    expect(hrefs).toContain(expected);
  }
  expect(hrefs).not.toContain('/search');
  for (const href of hrefs.filter(Boolean)) {
    expect(href).not.toMatch(
      /^\/(?:gioi-thieu|gio-le|su-kien|thu-vien|lien-he|tim-kiem|bai-viet|chuyen-muc)(?:\/|$)/,
    );
  }
});
