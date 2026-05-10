import { X, Plus, Loader2 } from 'lucide-react';

interface ProductImagesProps {
  images: string[];
  setImages: (images: string[]) => void;
  uploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProductImages({
  images,
  setImages,
  uploading,
  handleImageUpload
}: ProductImagesProps) {
  return (
    <div>
      <label className="block text-[10px] uppercase text-gray-500 mb-2">
        Product Images (Max 5)
      </label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative w-24 h-24 border border-gray-200">
            <img src={url} className="w-full h-full object-cover" alt="" />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 p-1 rounded-full shadow-sm hover:bg-red-50"
            >
              <X size={12}/>
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0d2818] transition-colors text-gray-400 hover:text-[#0d2818]">
            <input
              type="file"
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
              multiple
            />
            {uploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24}/>}
            <span className="text-[10px] mt-1">Upload</span>
          </label>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">{images.length}/5 images</p>
    </div>
  );
}
