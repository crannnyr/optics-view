import { Plus, X } from 'lucide-react';

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES = Array.from({ length: 16 }, (_, i) => String(30 + i)); // 30-45

interface ProductVariantsProps {
  colorOptions: string[];
  typeOptions: string[];
  sizeOptions: string[];
  newColor: string;
  setNewColor: (v: string) => void;
  newType: string;
  setNewType: (v: string) => void;
  newSize: string;
  setNewSize: (v: string) => void;
  addColor: () => void;
  removeColor: (v: string) => void;
  addType: () => void;
  removeType: (v: string) => void;
  addSize: () => void;
  removeSize: (v: string) => void;
}

export default function ProductVariants({
  colorOptions, typeOptions, sizeOptions,
  newColor, setNewColor, newType, setNewType, newSize, setNewSize,
  addColor, removeColor, addType, removeType, addSize, removeSize,
}: ProductVariantsProps) {

  const addPresetSize = (size: string) => {
    if (!sizeOptions.includes(size)) {
      // Temporarily set and trigger add
      setNewSize(size);
    }
  };

  return (
    <div className="border-t pt-5">
      <h3 className="text-sm font-medium text-[#0d2818] mb-3">Product Variants (Optional)</h3>

      {/* Colors */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Color Options</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g. Black, Gold, Silver"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
            className="flex-1 border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
          <button type="button" onClick={addColor}
            className="bg-[#0d2818] text-white px-4 py-2 text-xs hover:bg-opacity-90">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color, i) => (
            <div key={i} className="bg-gray-100 px-3 py-1 text-xs flex items-center gap-2 rounded">
              <span>{color}</span>
              <button type="button" onClick={() => removeColor(color)} className="text-red-500 hover:text-red-700">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Types */}
      <div className="mb-4">
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Type Options</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="e.g. Dark Shade, Transparent"
            value={newType}
            onChange={e => setNewType(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addType())}
            className="flex-1 border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
          <button type="button" onClick={addType}
            className="bg-[#0d2818] text-white px-4 py-2 text-xs hover:bg-opacity-90">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((type, i) => (
            <div key={i} className="bg-gray-100 px-3 py-1 text-xs flex items-center gap-2 rounded">
              <span>{type}</span>
              <button type="button" onClick={() => removeType(type)} className="text-red-500 hover:text-red-700">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Size Options</label>

        {/* Quick presets */}
        <div className="mb-2">
          <p className="text-[10px] text-gray-400 mb-1">Clothing quick-add:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {CLOTHING_SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (!sizeOptions.includes(s)) {
                    setNewSize(s);
                    setTimeout(() => addSize(), 0);
                  }
                }}
                disabled={sizeOptions.includes(s)}
                className={`px-2 py-1 text-[10px] border rounded transition-colors ${
                  sizeOptions.includes(s)
                    ? 'bg-[#0d2818] text-white border-[#0d2818]'
                    : 'border-gray-300 text-gray-600 hover:border-[#0d2818]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mb-1">Shoe sizes quick-add:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {SHOE_SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (!sizeOptions.includes(s)) {
                    setNewSize(s);
                    setTimeout(() => addSize(), 0);
                  }
                }}
                disabled={sizeOptions.includes(s)}
                className={`px-2 py-1 text-[10px] border rounded transition-colors ${
                  sizeOptions.includes(s)
                    ? 'bg-[#0d2818] text-white border-[#0d2818]'
                    : 'border-gray-300 text-gray-600 hover:border-[#0d2818]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Custom size input */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Custom size e.g. 32W/30L"
            value={newSize}
            onChange={e => setNewSize(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
            className="flex-1 border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
          <button type="button" onClick={addSize}
            className="bg-[#0d2818] text-white px-4 py-2 text-xs hover:bg-opacity-90">
            <Plus size={14} />
          </button>
        </div>

        {/* Selected sizes */}
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size, i) => (
            <div key={i} className="bg-gray-100 px-3 py-1 text-xs flex items-center gap-2 rounded">
              <span>{size}</span>
              <button type="button" onClick={() => removeSize(size)} className="text-red-500 hover:text-red-700">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
