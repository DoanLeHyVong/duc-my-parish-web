import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { HomeData } from '../../types';
import { Header } from './Header';

afterEach(cleanup);

describe('Header CMS menu URLs', () => {
  it('normalizes only known internal legacy paths and preserves suffixes', () => {
    const urls = [
      ['/gioi-thieu?source=cms#history', '/about?source=cms#history'],
      ['/gio-le', '/mass-schedule'],
      ['/su-kien', '/events'],
      ['/thu-vien', '/gallery'],
      ['/lien-he', '/contact'],
      ['/tim-kiem', '/search'],
      ['/bai-viet/slug-bai-viet', '/posts/slug-bai-viet'],
      ['/chuyen-muc/tin-giao-xu', '/categories/tin-giao-xu'],
      ['/quyen-rieng-tu', '/privacy'],
      ['/dieu-khoan-su-dung', '/terms'],
      ['/ho-tro', '/support'],
      ['/yeu-cau-du-lieu', '/data-request'],
      ['/privacy.html', '/privacy'],
      ['/terms.html', '/terms'],
      ['/support.html', '/support'],
      ['/data-request.html', '/data-request'],
      ['/custom-internal-path', '/custom-internal-path'],
      ['https://example.org/gioi-thieu', 'https://example.org/gioi-thieu'],
    ];
    const data = {
      profile: null,
      banners: [],
      menu: {
        items: urls.map(([url], index) => ({
          id: index,
          label: `Menu ${index}`,
          url,
          target: '_self',
        })),
      },
      sections: [],
      posts: [],
      announcements: [],
      massSchedules: [],
      events: [],
      albums: [],
    } satisfies HomeData;

    render(
      <MemoryRouter>
        <Header data={data} />
      </MemoryRouter>,
    );

    urls.forEach(([, expected], index) => {
      expect(screen.getByRole('link', { name: `Menu ${index}` })).toHaveAttribute(
        'href',
        expected,
      );
    });
  });
});
