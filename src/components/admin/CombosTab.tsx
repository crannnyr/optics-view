import { useState, useEffect } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { Gift, Plus, Trash2, X } from 'lucide-react';

interface ComboProduct {
  id: string;
  name: string;
  combo_price: number;
  original_total_price: number;
  discount_percentage: number;
  stock: number;
  is_active: boolean;
  product_1_name: string;
  product_1_price: number;
  product_1_image_url: string;
  product_2_name: string;
  product_2_price: number;
  product_2_image_url: string;
  created_at: string;
}

export default function CombosTab() {
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedProduct1, setSelectedProduct1] = useState<Product | null>(null);
  const [selectedProduct2, setSelectedProduct2] = useState<Product | null>(null);
  const [selectedImage1, setSelectedImage1] = useState('');
  const [selectedImage2, setSelectedImage2] = useState('');
  const [comboName, setComboName] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [comboPrice, setComboPrice] = useState(0);
  const [comboStock, setComboStock] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct1 && selectedProduct2) {
      const autoName = `${selectedProduct1.name} + ${selectedProduct2.name} Combo`;
      const total = selectedProduct1.price + selectedProduct2.price;
      setComboName(autoName);
      setComboPrice(Math.round(total * 0.9)); // Auto 10% discount
    }
  }, [selectedProduct1, selectedProduct2]);

  const loadData = async () => {
    setLoading(true);
    
    // Load products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    // Load combo products
    const { data: combosData } = await supabase
      .from('combo_products_detailed')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsData) setProducts(productsData);
    if (combosData) setCombos(combosData);
    
    setLoading(false);
  };

  const getProductImages = (product: Product): string[] => {
    const imgs = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) imgs.push(...product.images);
    return imgs;
  };

  const handleCreateCombo = async () => {
    if (!selectedProduct1 || !selectedProduct2 || !selectedImage1 || !selectedImage2) {
      alert('Please select both products and their images');
      return;
    }

    const originalTotal = selectedProduct1.price + selectedProduct2.price;
    
    if (comboPrice >= originalTotal) {
      alert('Combo price must be less than the sum of individual prices');
      return;
    }

    const { error } = await supabase
      .from('combo_products')
      .insert({
        name: comboName,
        description: comboDescription,
        product_1_id: selectedProduct1.id,
        product_2_id: selectedProduct2.id,
        product_1_image_url: selectedImage1,
        product_2_image_url: selectedImage2,
        original_total_price: originalTotal,
        combo_price: comboPrice,
        stock: comboStock,
        is_active: true
      });

    if (error) {
      alert('Failed to create combo: ' + error.message);
      return;
    }

    alert('Combo created successfully!');
    resetForm();
    loadData();
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm('Delete this combo?')) return;
    
    await supabase.from('combo_products').delete().eq('id', id);
    loadData();
  };

  const resetForm = () => {
    setIsCreating(false);
    setSelectedProduct1(null);
    setSelectedProduct2(null);
    setSelectedImage1('');
    setSelectedImage2('');
    setComboName('');
    setComboDescription('');
    setComboPrice(0);
    setComboStock(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d2818]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-light">Combo Products</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-[#0d2818] text-white px-6 py-2 text-xs tracking-widest hover:bg-opacity-90"
        >
          {isCreating ? <X size={14} /> : <Plus size={14} />}
          {isCreating ? 'CANCEL' : 'CREATE COMBO'}
        </button>
      </div>

      {/* Create Combo Form */}
      {isCreating && (
        <div className="bg-white border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium mb-6">Create New Combo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Product 1 Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Product 1
              </label>
              <select
                value={selectedProduct1?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct1(product || null);
                  setSelectedImage1('');
                }}
                className="w-full border border-gray-300 p-3 text-sm mb-3"
              >
                <option value="">Select Product 1</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₦{product.price.toLocaleString()}
                  </option>
                ))}
              </select>

              {selectedProduct1 && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Select Image for Product 1
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {getProductImages(selectedProduct1).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage1(img)}
                        className={`cursor-pointer border-2 ${
                          selectedImage1 === img ? 'border-[#0d2818]' : 'border-gray-200'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product 2 Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Product 2
              </label>
              <select
                value={selectedProduct2?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct2(product || null);
                  setSelectedImage2('');
                }}
                className="w-full border border-gray-300 p-3 text-sm mb-3"
              >
                <option value="">Select Product 2</option>
                {products.filter(p => p.id !== selectedProduct1?.id).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₦{product.price.toLocaleString()}
                  </option>
                ))}
              </select>

              {selectedProduct2 && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Select Image for Product 2
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {getProductImages(selectedProduct2).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage2(img)}
                        className={`cursor-pointer border-2 ${
                          selectedImage2 === img ? 'border-[#0d2818]' : 'border-gray-200'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Preview */}
          {selectedProduct1 && selectedProduct2 && (
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Original Total:</span>
                <span className="font-bold text-lg">
                  ₦{(selectedProduct1.price + selectedProduct2.price).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Discount:</span>
                <span className="text-green-600 font-medium">
                  {((selectedProduct1.price + selectedProduct2.price - comboPrice) / (selectedProduct1.price + selectedProduct2.price) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Combo Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Combo Name
              </label>
              <input
                type="text"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                className="w-full border border-gray-300 p-3 text-sm"
                placeholder="E.g., Premium Bundle Deal"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                Description
              </label>
              <textarea
                value={comboDescription}
                onChange={(e) => setComboDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 text-sm"
                rows={3}
                placeholder="Describe what makes this combo special..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Combo Price (₦)
                </label>
                <input
                  type="number"
                  value={comboPrice}
                  onChange={(e) => setComboPrice(Number(e.target.value))}
                  className="w-full border border-gray-300 p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={comboStock}
                  onChange={(e) => setComboStock(Number(e.target.value))}
                  className="w-full border border-gray-300 p-3 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateCombo}
            disabled={!selectedProduct1 || !selectedProduct2 || !selectedImage1 || !selectedImage2}
            className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            CREATE COMBO
          </button>
        </div>
      )}

      {/* Existing Combos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {combos.map((combo) => (
          <div key={combo.id} className="bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-[#0d2818]" />
                <h3 className="font-medium text-[#0d2818]">{combo.name}</h3>
              </div>
              <button
                onClick={() => handleDeleteCombo(combo.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Product Images */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <img src={combo.product_1_image_url} alt={combo.product_1_name} className="w-full h-32 object-cover border border-gray-200" />
                <p className="text-xs text-gray-600 mt-1">{combo.product_1_name}</p>
                <p className="text-xs text-gray-500">₦{combo.product_1_price.toLocaleString()}</p>
              </div>
              <div>
                <img src={combo.product_2_image_url} alt={combo.product_2_name} className="w-full h-32 object-cover border border-gray-200" />
                <p className="text-xs text-gray-600 mt-1">{combo.product_2_name}</p>
                <p className="text-xs text-gray-500">₦{combo.product_2_price.toLocaleString()}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 border border-gray-200 p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Original Price:</span>
                <span className="line-through text-gray-500">₦{combo.original_total_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Combo Price:</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-green-600">₦{combo.combo_price.toLocaleString()}</span>
                  <span className="block text-xs text-green-600">{combo.discount_percentage}% OFF</span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Stock: {combo.stock} | Status: {combo.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>

      {combos.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-white border border-gray-200">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No combo products yet</p>
          <p className="text-sm text-gray-400 mt-2">Create your first combo deal to boost sales</p>
        </div>
      )}
    </div>
  );
}