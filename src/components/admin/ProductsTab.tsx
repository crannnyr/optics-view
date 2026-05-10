import { useState, useEffect } from 'react';
import { supabase, Product, Review } from '../../lib/supabase';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import ProductModal from './ProductModal';

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
  };

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

  const handleSuccess = () => {
    handleCloseModal();
    loadProducts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-light">Product Management</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#0d2818] text-white px-6 py-2 text-xs tracking-widest hover:bg-opacity-90"
        >
          <Plus size={14} /> ADD PRODUCT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border bg-white group">
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              <img
                src={product.images?.[0] || product.image_url}
                className="w-full h-full object-cover"
                alt={product.name}
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-[#0d2818]">{product.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Stock: {product.stock} | ₦{product.price.toLocaleString()}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 border border-[#0d2818] py-2 text-xs hover:bg-[#0d2818] hover:text-white transition-colors"
                >
                  EDIT
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="px-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
