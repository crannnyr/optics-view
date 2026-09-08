import { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvatarPickerModalProps {
  currentAvatarUrl: string | null;
  userId: string;
  themeColor: string;
  onClose: () => void;
  onSaved: (url: string) => void;
}

// Preset options a shopper can pick instead of uploading their own photo —
// Jenny's chosen template set, stored in the same product-images bucket.
const PRESET_AVATARS = [
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.36116269141949375.webp',
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.8455794179387494.webp',
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.025190616668739896.webp',
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.4351619386075868.webp',
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.6934644292753092.webp',
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.9595164790349177.webp',
];

export default function AvatarPickerModal({ currentAvatarUrl, userId, themeColor, onClose, onSaved }: AvatarPickerModalProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setPreview(data.publicUrl);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (preview) onSaved(preview);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-medium text-gray-900">Profile Picture</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                {preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl font-light">?</div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: themeColor }}
                aria-label="Upload photo"
              >
                <Camera size={16} />
              </button>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {error && <p className="text-xs text-red-600 text-center mb-3">{error}</p>}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full text-white py-3 text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 mb-6"
            style={{ backgroundColor: themeColor }}
          >
            <Camera size={16} />
            {uploading ? 'Uploading…' : 'Upload a Photo'}
          </button>

          <p className="text-sm text-gray-500 mb-3">Or choose one of these</p>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AVATARS.map(url => (
              <button
                key={url}
                onClick={() => setPreview(url)}
                className={`aspect-square rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                  preview === url ? 'ring-2 ring-offset-2' : 'border-transparent'
                }`}
                style={preview === url ? { borderColor: themeColor, ['--tw-ring-color' as any]: themeColor } : undefined}
              >
                <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={!preview || uploading}
            className="w-full mt-6 py-3 text-sm font-medium rounded-full border-2 disabled:opacity-40"
            style={{ borderColor: themeColor, color: themeColor }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
