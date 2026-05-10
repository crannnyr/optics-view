interface ProductPricingProps {
  formData: {
    price: string;
    cost_price: string;
    compare_at_price: string;
    wholesale_price: string;
    [key: string]: any;
  };
  setFormData: (data: any) => void;
}

export default function ProductPricing({ formData, setFormData }: ProductPricingProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-100">
        <div>
          <label className="block text-[10px] uppercase text-[#0d2818] font-bold mb-1">Selling Price (₦)</label>
          <input
            type="number"
            required
            placeholder="0"
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Buying Price (Cost)</label>
          <input
            type="number"
            placeholder="0 (Hidden)"
            value={formData.cost_price}
            onChange={e => setFormData({...formData, cost_price: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Compare At Price</label>
          <input
            type="number"
            placeholder="e.g. 25000 (Slashed)"
            value={formData.compare_at_price}
            onChange={e => setFormData({...formData, compare_at_price: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Wholesale Price</label>
          <input
            type="number"
            placeholder="e.g. 15000"
            value={formData.wholesale_price}
            onChange={e => setFormData({...formData, wholesale_price: e.target.value})}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
