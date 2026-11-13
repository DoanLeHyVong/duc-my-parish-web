import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Footer } from './Footer';

afterEach(cleanup);

describe('Footer', () => {
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
