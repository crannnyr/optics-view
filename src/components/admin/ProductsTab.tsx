import { useState, useEffect } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { Plus, Trash2, Loader2, AlertTriangle, CheckCircle, Image, ArrowUpDown } from 'lucide-react';
import ProductModal from './ProductModal';

interface ProductWithSize extends Product {
  image_size_kb: number | null;
}

type SortMode = 'size_desc' | 'size_asc' | 'newest' | 'name';

export default function ProductsTab() {
  const [products, setProducts]       = useState<ProductWithSize[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortMode, setSortMode]       = useState<SortMode>('size_desc');
  const [search, setSearch]           = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);

    // Fetch products + their primary image size in one query via RPC-style join
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!prods) { setLoading(false); return; }

    // Get storage sizes for all primary images in one query
    const filenames = prods
      .map(p => {
        const url = p.images?.[0] || p.image_url || '';
        return url.split('/product-images/')[1] || null;
      })
      .filter(Boolean) as string[];

    const { data: storageObjects } = await supabase
      .from('storage.objects')
      .select('name, metadata')
      .eq('bucket_id', 'product-images')
      .in('name', filenames);

    // Build a size map keyed by filename
    const sizeMap = new Map<string, number>();
    for (const obj of storageObjects || []) {
      const kb = obj.metadata?.size ? Math.round(obj.metadata.size / 1024) : 0;
      sizeMap.set(obj.name, kb);
    }

    const withSizes: ProductWithSize[] = prods.map(p => {
      const url = p.images?.[0] || p.image_url || '';
      const filename = url.split('/product-images/')[1] || '';
      return { ...p, image_size_kb: sizeMap.get(filename) ?? null };
    });

    setProducts(withSizes);
    setLoading(false);
  };

  const sorted = [...products]
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'size_desc') return (b.image_size_kb ?? 0) - (a.image_size_kb ?? 0);
      if (sortMode === 'size_asc')  return (a.image_size_kb ?? 0) - (b.image_size_kb ?? 0);
      if (sortMode === 'name')      return a.name.localeCompare(b.name);
      return 0; // newest — already ordered from DB
    });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const sizeColor = (kb: number | null) => {
    if (kb === null) return 'text-gray-300';
    if (kb > 500)  return 'text-red-500';
    if (kb > 100)  return 'text-orange-400';
    return 'text-green-500';
  };

  const sizeIcon = (kb: number | null) => {
    if (kb === null) return null;
    if (kb > 500)  return <AlertTriangle size={11} className="text-red-400" />;
    if (kb > 100)  return <AlertTriangle size={11} className="text-orange-400" />;
    return <CheckCircle size={11} className="text-green-400" />;
  };

  const heavyCount = products.filter(p => (p.image_size_kb ?? 0) > 100).length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-light">Products</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {products.length} total
            {heavyCount > 0 && (
              <span className="ml-2 text-orange-500">· {heavyCount} need re-upload</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0d2818] text-white px-5 py-2 text-xs tracking-widest hover:opacity-90"
        >
          <Plus size={13} /> ADD
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Under 100KB — good</span>
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-orange-400" /> 100–500KB — re-upload</span>
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-red-400" /> Over 500KB — urgent</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0d2818] rounded w-48"
        />
        <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
          {([
            { key: 'size_desc', label: 'Heaviest' },
            { key: 'size_asc',  label: 'Lightest' },
            { key: 'newest',    label: 'Newest' },
            { key: 'name',      label: 'Name' },
          ] as const).map(s => (
            <button
              key={s.key}
              onClick={() => setSortMode(s.key)}
              className={`px-3 py-2 text-[10px] tracking-wider transition-colors ${
                sortMode === s.key
                  ? 'bg-[#0d2818] text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
            <div className="col-span-1" />
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-2 flex items-center gap-1">
              <Image size={10} /> Image
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">No products found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sorted.map(product => (
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="col-span-1">
                    <div className="w-9 h-9 bg-gray-100 rounded overflow-hidden shrink-0">
                      <img
                        src={product.images?.[0] || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-4">
                    <p className="text-xs font-medium text-[#0d2818] truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{product.category}</p>
                  </div>

                  {/* Price */}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-700">₦{product.price.toLocaleString()}</p>
                  </div>

                  {/* Stock */}
                  <div className="col-span-1">
                    <span className={`text-xs ${product.stock <= 5 ? 'text-red-500' : 'text-gray-600'}`}>
                      {product.stock}
                    </span>
                  </div>

                  {/* Image size */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      {sizeIcon(product.image_size_kb)}
                      <span className={`text-[10px] font-medium ${sizeColor(product.image_size_kb)}`}>
                        {product.image_size_kb !== null ? `${product.image_size_kb}KB` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-[10px] tracking-wider border border-[#0d2818] text-[#0d2818] px-3 py-1.5 hover:bg-[#0d2818] hover:text-white transition-colors rounded"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 border border-red-200 text-red-400 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSuccess={() => { handleCloseModal(); loadProducts(); }}
        />
      )}
    </div>
  );
}
