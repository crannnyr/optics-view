import { Category } from '../hooks/useSettings';

interface CategoryItemType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface ProductBasicInfoProps {
  formData: {
    name: string;
    description: string;
    stock: string;
    wholesale_min_qty: string;
    product_type: string;
    category: string;
    supplier: string;
    [key: string]: any;
  };
  setFormData: (data: any) => void;
  categories: Category[];
  categoriesLoading: boolean;
  availableItemTypes: CategoryItemType[];
  handleCategoryChange: (slug: string) => void;
}

const SUPPLIERS = [
  { value: 'jumia', label: '🟠 Jumia' },
  { value: 'shein', label: '🟣 Shein' },
  { value: 'own',   label: '🟢 Own Stock' },
];

export default function ProductBasicInfo({
  formData,
  setFormData,
  categories,
  categoriesLoading,
  availableItemTypes,
  handleCategoryChange
}: ProductBasicInfoProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-1">Product Name</label>
        <input
          required
          placeholder="e.g. Vintage Frames"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-1">Description</label>
        <textarea
          required
          placeholder="Product details..."
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full border p-3 text-sm h-32 focus:border-[#0d2818] outline-none resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Category</label>
        {categoriesLoading ? (
          <div className="w-full border p-3 text-sm text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="w-full border p-3 text-sm text-red-400">
            No categories found. Add one in Settings → Categories first.
          </div>
        ) : (
          <select
            value={formData.category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Item Type */}
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Item Type</label>
        {availableItemTypes.length === 0 ? (
          <div className="w-full border p-3 text-sm text-gray-400">
            No item types for this category. Add some in Settings → Categories.
          </div>
        ) : (
          <select
            value={formData.product_type}
            onChange={e => setFormData({ ...formData, product_type: e.target.value })}
            className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
          >
            {availableItemTypes.map(type => (
              <option key={type.id} value={type.slug}>{type.name}</option>
            ))}
          </select>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          Item types are managed in Settings → Categories
        </p>
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-2">Supplier</label>
        <select
          value={formData.supplier || 'jumia'}
          onChange={e => setFormData({ ...formData, supplier: e.target.value })}
          className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
        >
          {SUPPLIERS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          Used to generate tracking links when order is shipped.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Stock Level</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={e => setFormData({ ...formData, stock: e.target.value })}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Wholesale Min Qty</label>
          <input
            type="number"
            value={formData.wholesale_min_qty}
            onChange={e => setFormData({ ...formData, wholesale_min_qty: e.target.value })}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
