import { useQuery } from '@tanstack/react-query';
import { api } from '../../apis/client';
import { PageSeo } from '../../components/common/SiteSeo';

export function PolicyPage({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ['public-policy', slug], queryFn: async () => (await api.get(`/public/policies/${slug}`)).data.data });
  if (query.isLoading) return <main className="section container policy-public"><p>Đang tải chính sách…</p></main>;
  if (query.isError || !query.data) return <><PageSeo noindex /><main className="section container policy-public"><h1>Chính sách chưa được công bố</h1><p>Vui lòng quay lại sau hoặc liên hệ Giáo xứ để được hỗ trợ.</p></main></>;
  return <><PageSeo title={query.data.title} /><main className="section container policy-public"><header><span className="eyebrow">THÔNG TIN CÔNG KHAI</span><h1>{query.data.title}</h1><p>Cập nhật {new Date(query.data.publishedAt).toLocaleDateString('vi-VN')}</p></header><article dangerouslySetInnerHTML={{ __html: query.data.contentHtml }} /></main></>;
}
