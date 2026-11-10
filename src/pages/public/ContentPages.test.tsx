import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicApi } from '../../apis/public.api';
import { CategoryPage } from './ContentPages';

vi.mock('../../apis/public.api', () => ({
  publicApi: { category: vi.fn() },
}));

afterEach(cleanup);

describe('CategoryPage aliases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.category).mockResolvedValue({
      category: { name: 'Tin giáo xứ' },
      posts: [],
    } as never);
  });

  it.each([
    ['parish-news', 'tin-giao-xu'],
    ['announcements', 'thong-bao'],
    ['daily-word', 'loi-chua-hang-ngay'],
    ['diocese-news', 'tin-giao-phan'],
    ['bible-study', 'hoc-hoi-kinh-thanh'],
    ['catechism', 'giao-ly'],
  ])('resolves English alias %s to CMS slug %s', async (alias, cmsSlug) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/categories/${alias}`]}>
          <Routes>
            <Route path="/categories/:slug" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Tin giáo xứ')).toBeInTheDocument();
    expect(publicApi.category).toHaveBeenCalledWith(cmsSlug);
  });

  it('passes an unknown category slug through unchanged', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/categories/custom-slug']}>
          <Routes>
            <Route path="/categories/:slug" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Tin giáo xứ')).toBeInTheDocument();
    expect(publicApi.category).toHaveBeenCalledWith('custom-slug');
  });

  it('does not treat inherited object keys as aliases', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/categories/constructor']}>
          <Routes>
            <Route path="/categories/:slug" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Tin giáo xứ')).toBeInTheDocument();
    expect(publicApi.category).toHaveBeenCalledWith('constructor');
  });
});
