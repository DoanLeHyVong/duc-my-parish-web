import { RefreshCw } from 'lucide-react';

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="error-state">
      <p>Không thể kết nối máy chủ. Vui lòng kiểm tra Express API.</p>
      {retry && <button className="button outline" onClick={retry}><RefreshCw size={16} /> Thử lại</button>}
    </div>
  );
}
