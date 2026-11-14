import { useQuery } from '@tanstack/react-query';
import { api } from '../../apis/client';

const paths: Record<string, string> = {
  '/privacy': 'privacy-policy',
  '/terms': 'terms-of-use',
  '/support': 'support',
  '/data-request': 'data-request',
};

export function usePublicPolicies() {
  return useQuery({
    queryKey: ['public-policies'],
    queryFn: async () => (await api.get('/public/policies')).data.data as { slug: string; kind: string | null; title: string }[],
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function usePolicyVisibility() {
  const query = usePublicPolicies();
  const visible = new Set(query.data?.map((item) => item.slug) ?? []);
  return (url: string) => {
    const path = url.split(/[?#]/, 1)[0];
    if (path.startsWith('/policies/')) return visible.has(path.slice('/policies/'.length));
    return !paths[path] || visible.has(paths[path]);
  };
}
