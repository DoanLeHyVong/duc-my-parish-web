import { api } from './client';
import type { HomeData, Post } from '../types';

export const publicApi = {
  home: () => api.get<{ data: HomeData }>('/public/home').then((r) => r.data.data),
  posts: (params?: Record<string, unknown>) => api.get<{ data: Post[] }>('/public/posts', { params }).then((r) => r.data.data),
  post: (slug: string) => api.get<{ data: Post }>(`/public/posts/${slug}`).then((r) => r.data.data),
  category: (slug: string) => api.get(`/public/categories/${slug}/posts`).then((r) => r.data.data),
  search: (q: string) => api.get('/public/search', { params: { q } }).then((r) => r.data.data),
  masses: () => api.get('/public/mass-schedules').then((r) => r.data.data),
  events: () => api.get('/public/events').then((r) => r.data.data),
  albums: () => api.get('/public/albums').then((r) => r.data.data),
  profile: () => api.get('/public/parish-profile').then((r) => r.data.data),
};
