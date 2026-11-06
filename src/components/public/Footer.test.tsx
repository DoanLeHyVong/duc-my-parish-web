import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('links to every public policy route', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    for (const [name, href] of [
      ['Quyền riêng tư', '/quyen-rieng-tu'],
      ['Điều khoản sử dụng', '/dieu-khoan-su-dung'],
      ['Hỗ trợ', '/ho-tro'],
      ['Yêu cầu dữ liệu', '/yeu-cau-du-lieu'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });
});
