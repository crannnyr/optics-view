import { useState } from 'react';
import { ImagePlus, Loader2, CheckCircle2 } from 'lucide-react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { compressImage } from '../../../lib/imageCompress';

interface PhotoUploadSlotProps {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  themeColor: string;
}

export default function PhotoUploadSlot({ label, hint, value, onChange, themeColor }: PhotoUploadSlotProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const compressed = await compressImage(file, 1000, 120);
    const fileName = `${crypto.randomUUID()}.webp`;

    const { error } = await supabase.storage
      .from('vendor-uploads')
      .upload(fileName, compressed, { contentType: 'image/webp', cacheControl: '31536000' });

    if (!error) {
      const { data } = supabase.storage.from('vendor-uploads').getPublicUrl(fileName);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-xs uppercase text-gray-500 mb-1.5">{label}</label>
      <p className="text-[11px] text-gray-400 mb-2">{hint}</p>
      <label
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg h-36 cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
        style={{ borderColor: value ? themeColor : '#d1d5db' }}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-gray-400" />
        ) : value ? (
          <div className="relative w-full h-full">
            <img src={value} alt={label} className="w-full h-full object-contain bg-white" />
            <CheckCircle2 size={16} className="absolute top-2 right-2" style={{ color: themeColor }} />
          </div>
        ) : (
          <>
            <ImagePlus size={22} className="text-gray-300" />
            <span className="text-xs text-gray-400">Tap to upload</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}
