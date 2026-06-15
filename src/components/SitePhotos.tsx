import { useState, useEffect, useRef } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAppBasePath } from '../utils/appBase';

interface Photo {
  id: number;
  file_path: string;
  file_name: string;
  caption: string;
  uploaded_by_name: string;
  created_at: string;
}

export default function SitePhotos({ siteId }: { siteId: string | number }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { hasPermission } = useAuth();
  const toast = useToast();

  // Match the API gates exactly: upload requires sites.edit, delete requires sites.manage.
  // Previously callers passed an unrelated flag (entries.create, or hardcoded true), so
  // users could see buttons that silently 403'd on click.
  const canUpload = hasPermission('sites.edit');
  const canDelete = hasPermission('sites.manage');

  useEffect(() => {
    api.get<Photo[]>('photos.list', { site_id: siteId })
      .then(res => setPhotos(res.data))
      .catch(() => {});
  }, [siteId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await api.upload('photos.upload', file, { site_id: String(siteId) });
      const res = await api.get<Photo[]>('photos.list', { site_id: siteId });
      setPhotos(res.data);
      toast.success('Photo uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (photoId: number) => {
    try {
      await api.delete('photos.delete', photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">Photos ({photos.length})</p>
        {canUpload && (
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1 text-xs text-dict-blue hover:text-blue-800 disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
              {isUploading ? 'Uploading...' : 'Add Photo'}
            </button>
          </>
        )}
      </div>
      {photos.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No photos uploaded</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative group">
              <img
                src={`${getAppBasePath()}${photo.file_path}`}
                alt={photo.caption || photo.file_name}
                className="w-full h-20 object-cover rounded-lg border border-slate-200"
              />
              {canDelete && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
