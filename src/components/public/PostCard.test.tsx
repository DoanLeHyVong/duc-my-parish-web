import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import type { Post } from '../../types';
import { PostCard } from './PostCard';

it('uses the canonical post path for every card action', () => {
  const post: Post = {
    id: 1,
    title: 'Bài kiểm tra',
    slug: 'bai-kiem-tra',
    excerpt: 'Mô tả',
    content: '',
    isFeatured: false,
    viewCount: 0,
  };
  render(
    <MemoryRouter>
      <PostCard post={post} />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('link')).toHaveLength(3);
  for (const link of screen.getAllByRole('link')) {
    expect(link).toHaveAttribute('href', '/posts/bai-kiem-tra');
  }
});
