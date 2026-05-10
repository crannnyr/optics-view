interface ProductBasicInfoProps {
  formData: {
    name: string;
    description: string;
    stock: string;
    wholesale_min_qty: string;
    product_type: string;
    [key: string]: any;
  };
  setFormData: (data: any) => void;
}

export default function ProductBasicInfo({ formData, setFormData }: ProductBasicInfoProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-1">Product Name</label>
        <input
          required
          placeholder="e.g. Vintage Frames"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-1">Description</label>
        <textarea
          required
          placeholder="Product details..."
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="w-full border p-3 text-sm h-32 focus:border-[#0d2818] outline-none resize-none"
        />
      </div>

      {/* PRODUCT TYPE */}
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Product Type</label>
        <select
          value={formData.product_type || 'video'}
          onChange={e => setFormData({...formData, product_type: e.target.value})}
          className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
        >
          <option value="video">Video</option>
          <option value="audio_only">Audio Only</option>
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          This determines which category filter shows this product
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Stock Level</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={e => setFormData({...formData, stock: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Wholesale Min Qty</label>
          <input
            type="number"
            value={formData.wholesale_min_qty}
            onChange={e => setFormData({...formData, wholesale_min_qty: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
