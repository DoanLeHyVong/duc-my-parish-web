import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';

let hidden = false;
vi.mock('./usePolicyVisibility', () => ({ usePolicyVisibility: () => (url: string) => !hidden || url !== '/privacy', usePublicPolicies: () => ({ data: [] }) }));

afterEach(() => { hidden = false; cleanup(); });

describe('Footer', () => {
  it('does not expose a hidden policy link', () => {
    hidden = true;
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Quyền riêng tư' })).not.toBeInTheDocument();
    hidden = false;
  });
  it('links to every public policy route', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    for (const [name, href] of [
      ['Quyền riêng tư', '/privacy'],
      ['Điều khoản sử dụng', '/terms'],
      ['Hỗ trợ', '/support'],
      ['Yêu cầu dữ liệu', '/data-request'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('uses canonical English paths for non-policy navigation', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    for (const [name, href] of [
      ['Giới thiệu', '/about'],
      ['Giờ lễ', '/mass-schedule'],
      ['Sự kiện', '/events'],
      ['Thư viện', '/gallery'],
      ['Tin giáo xứ', '/categories/parish-news'],
      ['Thông báo', '/categories/announcements'],
      ['Lời Chúa', '/categories/daily-word'],
      ['Liên hệ', '/contact'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('renders configured footer links, including external destinations', () => {
    render(<MemoryRouter><Footer menu={{ items: [
      { id: 1, label: 'Trang cộng đoàn', url: '/about' },
      { id: 2, label: 'Trang ngoài', url: 'https://example.org', target: '_blank' },
    ] as never }} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Trang cộng đoàn' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Trang ngoài' })).toHaveAttribute('href', 'https://example.org');
  });
});
