import { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Tag, Package, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Category, CategoryItemType } from '../hooks/useSettings';

interface Product {
  id: string;
  name: string;
  category: string;
  product_type: string;
  image_url: string;
  images?: string[];
}

interface CategoriesSettingsViewProps {
  categories: Category[];
  categoriesLoading: boolean;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newItemTypeInputs: Record<string, string>;
  setNewItemTypeInputs: (v: Record<string, string>) => void;
  categoryError: string;
  setCategoryError: (v: string) => void;
  handleAddCategory: () => void;
  handleDeleteCategory: (id: string) => void;
  handleAddItemType: (categoryId: string) => void;
  handleDeleteItemType: (itemTypeId: string, itemTypeSlug: string) => void;
  handleMoveProduct: (productId: string, newCategorySlug: string, newProductType: string) => Promise<boolean>;
  fetchCategories: () => void;
}

export default function CategoriesSettingsView({
  categories,
  categoriesLoading,
  newCategoryName,
  setNewCategoryName,
  newItemTypeInputs,
  setNewItemTypeInputs,
  categoryError,
  setCategoryError,
  handleAddCategory,
  handleDeleteCategory,
  handleAddItemType,
  handleDeleteItemType,
  handleMoveProduct,
  fetchCategories
}: CategoriesSettingsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [assignSection, setAssignSection] = useState(false);

  // Per-product reassign state
  const [reassigning, setReassigning] = useState<Record<string, { category: string; type: string }>>({});
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, category, product_type, image_url, images')
      .order('name', { ascending: true });
    if (data) setProducts(data);
    setProductsLoading(false);
  };

  const getReassignState = (product: Product) => {
    return reassigning[product.id] || { category: product.category, type: product.product_type };
  };

  const setReassignField = (productId: string, field: 'category' | 'type', value: string) => {
    setReassigning(prev => {
      const current = prev[productId] || {
        category: products.find(p => p.id === productId)?.category || '',
        type: products.find(p => p.id === productId)?.product_type || ''
      };
      const updated = { ...current, [field]: value };
      // Reset type if category changed and type no longer valid
      if (field === 'category') {
        const cat = categories.find(c => c.slug === value);
        const typeValid = cat?.item_types?.find(it => it.slug === updated.type);
        if (!typeValid && cat?.item_types?.length) {
          updated.type = cat.item_types[0].slug;
        }
      }
      return { ...prev, [productId]: updated };
    });
  };

  const handleSaveProduct = async (product: Product) => {
    const state = getReassignState(product);
    if (state.category === product.category && state.type === product.product_type) return;
    setSavingProduct(product.id);
    const ok = await handleMoveProduct(product.id, state.category, state.type);
    if (ok) {
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, category: state.category, product_type: state.type } : p
        )
      );
      setReassigning(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } else {
      alert('Failed to update product. Try again.');
    }
    setSavingProduct(null);
  };

  const isDirty = (product: Product) => {
    const state = reassigning[product.id];
    if (!state) return false;
    return state.category !== product.category || state.type !== product.product_type;
  };

  const getTypesForCategory = (categorySlug: string): CategoryItemType[] => {
    const cat = categories.find(c => c.slug === categorySlug);
    return cat?.item_types || [];
  };

  const getCategoryName = (slug: string) => categories.find(c => c.slug === slug)?.name || slug;
  const getTypeName = (categorySlug: string, typeSlug: string) => {
    const types = getTypesForCategory(categorySlug);
    return types.find(t => t.slug === typeSlug)?.name || typeSlug;
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutGrid size={24} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">Categories & Item Types</h2>
      </div>

      {/* Add Category */}
      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">New Category</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Accessories"
            value={newCategoryName}
            onChange={e => { setNewCategoryName(e.target.value); setCategoryError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 border p-3 text-sm focus:border-[#0d2818] outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="bg-[#0d2818] text-white px-5 py-3 text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {categoryError && (
          <p className="text-red-500 text-xs mt-2">{categoryError}</p>
        )}
      </div>

      {/* Categories List */}
      {categoriesLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border rounded-sm">
          No categories yet. Add one above.
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="bg-white border rounded-sm">
              {/* Category Row */}
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <Tag size={16} className="text-[#0d2818]" />
                  <span className="font-medium text-sm">{category.name}</span>
                  <span className="text-xs text-gray-400 font-mono">/{category.slug}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {category.item_types?.length || 0} types
                  </span>
                  {expandedCategory === category.id
                    ? <ChevronUp size={14} className="text-gray-400 ml-auto" />
                    : <ChevronDown size={14} className="text-gray-400 ml-auto" />
                  }
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded: Item Types */}
              {expandedCategory === category.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Item Types</p>

                  {/* Existing item types */}
                  {(category.item_types || []).length === 0 ? (
                    <p className="text-xs text-gray-400">No item types yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(category.item_types || []).map(it => (
                        <div
                          key={it.id}
                          className="flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded-sm text-sm"
                        >
                          <span>{it.name}</span>
                          <span className="text-gray-400 font-mono text-xs">({it.slug})</span>
                          <button
                            onClick={() => handleDeleteItemType(it.id, it.slug)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Remove item type"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add item type */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="e.g. Sunglasses"
                      value={newItemTypeInputs[category.id] || ''}
                      onChange={e =>
                        setNewItemTypeInputs({ ...newItemTypeInputs, [category.id]: e.target.value })
                      }
                      onKeyDown={e => e.key === 'Enter' && handleAddItemType(category.id)}
                      className="flex-1 border p-2 text-sm focus:border-[#0d2818] outline-none"
                    />
                    <button
                      onClick={() => handleAddItemType(category.id)}
                      className="border border-[#0d2818] text-[#0d2818] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#0d2818] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add Type
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Products Section */}
      <div className="bg-white border rounded-sm">
        <button
          onClick={() => setAssignSection(!assignSection)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-[#0d2818]" />
            <div>
              <p className="font-medium text-sm">Assign Products to Categories</p>
              <p className="text-xs text-gray-400 mt-0.5">Move existing products between categories and update their item type</p>
            </div>
          </div>
          {assignSection ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {assignSection && (
          <div className="border-t">
            {productsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm p-6">
                <Loader2 size={16} className="animate-spin" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-400 p-6">No products found.</p>
            ) : (
              <div className="divide-y">
                {products.map(product => {
                  const state = getReassignState(product);
                  const dirty = isDirty(product);
                  const saving = savingProduct === product.id;
                  const availableTypes = getTypesForCategory(state.category);
                  const thumb = (product.images?.[0] || product.image_url);

                  return (
                    <div key={product.id} className="flex items-center gap-4 p-4">
                      {/* Thumbnail */}
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded border flex-shrink-0" />
                      )}

                      {/* Name + current */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {getCategoryName(product.category)} → {getTypeName(product.category, product.product_type)}
                        </p>
                      </div>

                      {/* Category select */}
                      <select
                        value={state.category}
                        onChange={e => setReassignField(product.id, 'category', e.target.value)}
                        className="border p-2 text-xs focus:border-[#0d2818] outline-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                      </select>

                      <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />

                      {/* Item type select */}
                      <select
                        value={state.type}
                        onChange={e => setReassignField(product.id, 'type', e.target.value)}
                        className="border p-2 text-xs focus:border-[#0d2818] outline-none"
                        disabled={availableTypes.length === 0}
                      >
                        {availableTypes.length === 0 ? (
                          <option value="">No types</option>
                        ) : (
                          availableTypes.map(t => (
                            <option key={t.id} value={t.slug}>{t.name}</option>
                          ))
                        )}
                      </select>

                      {/* Save button */}
                      <button
                        onClick={() => handleSaveProduct(product)}
                        disabled={!dirty || saving}
                        className={`px-3 py-2 text-xs font-medium transition-all flex items-center gap-1 ${
                          dirty
                            ? 'bg-[#0d2818] text-white hover:opacity-90'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
