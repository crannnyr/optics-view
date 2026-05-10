import { Plus, X } from 'lucide-react';

interface ProductVariantsProps {
  colorOptions: string[];
  typeOptions: string[];
  newColor: string;
  setNewColor: (color: string) => void;
  newType: string;
  setNewType: (type: string) => void;
  addColor: () => void;
  removeColor: (color: string) => void;
  addType: () => void;
  removeType: (type: string) => void;
}

export default function ProductVariants({
  colorOptions,
  typeOptions,
  newColor,
  setNewColor,
  newType,
  setNewType,
  addColor,
  removeColor,
  addType,
  removeType
}: ProductVariantsProps) {
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
          <button
            type="button"
            onClick={addColor}
            className="bg-[#0d2818] text-white px-4 py-2 text-xs hover:bg-opacity-90"
          >
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
      <div>
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
          <button
            type="button"
            onClick={addType}
            className="bg-[#0d2818] text-white px-4 py-2 text-xs hover:bg-opacity-90"
          >
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
    </div>
  );
}
