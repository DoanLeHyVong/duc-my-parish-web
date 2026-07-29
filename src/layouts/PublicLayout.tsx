import { useQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import { publicApi } from '../apis/public.api';
import { Footer } from '../components/public/Footer';
import { Header } from '../components/public/Header';

export function PublicLayout() {
  const { data } = useQuery({ queryKey: ['home'], queryFn: publicApi.home, staleTime: 60_000 });
  return <><Header data={data} /><main><Outlet /></main><Footer profile={data?.profile} /></>;
}
