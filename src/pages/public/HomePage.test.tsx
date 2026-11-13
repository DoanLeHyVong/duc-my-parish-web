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

it('uses configured content without fabricating parish images or messages', async () => {
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
  for (const expected of ['/mass-schedule', '/categories/announcements', '/contact']) {
    expect(hrefs).toContain(expected);
  }
  expect(screen.queryByText(/Hãy ở lại trong tình yêu của Thầy/)).not.toBeInTheDocument();
  expect(document.querySelector('img[src="/hero-duc-my-v2.png"]')).toBeNull();
  expect(hrefs).not.toContain('/search');
  for (const href of hrefs.filter(Boolean)) {
    expect(href).not.toMatch(
      /^\/(?:gioi-thieu|gio-le|su-kien|thu-vien|lien-he|tim-kiem|bai-viet|chuyen-muc)(?:\/|$)/,
    );
  }
});

it('renders configured sections in API order with their own text and link', async () => {
  vi.mocked(publicApi.home).mockResolvedValue({
    profile: { name: 'Giáo xứ thử nghiệm', diocese: 'Giáo phận thử nghiệm', description: 'Giới thiệu', address: 'Địa chỉ' },
    banners: [], menu: null, posts: [], announcements: [], massSchedules: [], events: [], albums: [],
    sections: [
      { id: 2, sectionKey: 'latest-news', title: 'Tin cập nhật', componentType: 'GRID', displayLimit: 2, settings: { eyebrow: 'Mới', ctaText: 'Tất cả tin', ctaUrl: '/categories/parish-news' } },
      { id: 1, sectionKey: 'about', title: 'Cộng đoàn chúng tôi', componentType: 'FEATURED', displayLimit: 1, settings: { body: 'Nội dung do Admin nhập' } },
    ],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter><HomePage /></MemoryRouter></HelmetProvider></QueryClientProvider>);
  await screen.findByText('Nội dung do Admin nhập');
  expect(screen.getByRole('link', { name: /Tất cả tin/ })).toHaveAttribute('href', '/categories/parish-news');
  const sections = document.querySelectorAll('section');
  expect([...sections].findIndex((node) => node.textContent?.includes('Tin cập nhật'))).toBeLessThan([...sections].findIndex((node) => node.textContent?.includes('Cộng đoàn chúng tôi')));
});
