import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Loader2, AlertCircle, Check, X } from 'lucide-react';

export default function RetailerProductsTab({ profile }: { profile: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProductsAndPrices();
  }, [profile]);

  const fetchProductsAndPrices = async () => {
    if (!profile) return;
    setError(null);

    try {
      // 1. Get All Products (Added wholesale_price and images to selection)
      const { data: allProducts, error: prodError } = await supabase
        .from('products')
        .select('id, name, price, wholesale_price, image_url, images, description') 
        .order('name');

      if (prodError) throw prodError;

      // 2. Get Retailer's Custom Prices
      const { data: myPrices, error: priceError } = await supabase
        .from('retailer_products')
        .select('product_id, custom_price')
        .eq('retailer_id', profile.id);

      if (priceError) throw priceError;

      // 3. Merge Data
      const merged = allProducts?.map(p => {
        const custom = myPrices?.find(mp => mp.product_id === p.id);
        // CRITICAL FIX: Use Wholesale Price as the cost basis
        const costPrice = p.wholesale_price || p.price; 
        
        return {
          ...p,
          cost_price: costPrice, // Store this for easy access
          my_price: custom ? custom.custom_price : null, 
          profit: custom ? (custom.custom_price - costPrice) : 0
        };
      });

      setProducts(merged || []);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (product: any) => {
    setEditingId(product.id);
    // Default the input to their current price, or the Suggest Retail Price (product.price)
    setEditPrice(product.my_price ? product.my_price.toString() : product.price.toString());
  };

  const savePrice = async (productId: string, costPrice: number) => {
    setSaving(true);
    const newPrice = parseFloat(editPrice);

    // Validation: Ensure they don't sell below the wholesale cost (loss prevention)
    if (newPrice < costPrice) {
      alert(`You cannot sell below the wholesale cost (₦${costPrice.toLocaleString()})!`);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('retailer_products')
      .upsert({
        retailer_id: profile.id,
        product_id: productId,
        custom_price: newPrice
      }, { onConflict: 'retailer_id, product_id' });

    if (!error) {
      setEditingId(null);
      fetchProductsAndPrices(); 
    } else {
      alert("Failed to save price. Please try again.");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-xs tracking-widest text-gray-400">LOADING PRODUCTS...</div>;

  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded inline-block text-sm">
        <p className="font-bold mb-1">Error Loading Products</p>
        <p>{error}</p>
        <button onClick={fetchProductsAndPrices} className="mt-3 underline hover:no-underline">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <div>
          <h3 className="text-sm font-medium text-blue-900">Manage Your Profit Margins</h3>
          <p className="text-xs text-blue-800 mt-1">
            We provide items at <strong>Wholesale Price</strong>. You set the final selling price. 
            The difference is your profit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => {
          const isEditing = editingId === product.id;
          const hasMarkup = product.my_price !== null;
          const currentProfit = isEditing 
            ? (parseFloat(editPrice || '0') - product.cost_price) 
            : product.profit;

          // IMAGE FIX: Check array first, then fallback to string
          const displayImage = (product.images && product.images.length > 0) 
            ? product.images[0] 
            : product.image_url;

          return (
            <div key={product.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${isEditing ? 'ring-2 ring-[#0d2818] border-transparent shadow-md' : 'border-gray-200'}`}>
              
              <div className="flex p-4 gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                  {displayImage ? (
                     <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                  
                  {/* UPDATED: Show Wholesale Cost */}
                  <p className="text-xs text-gray-500 mt-1">
                    Wholesale Cost: <span className="font-medium text-gray-700">₦{product.cost_price.toLocaleString()}</span>
                  </p>
                  
                  {!hasMarkup && !isEditing && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 mt-2">
                      Not Added to Store
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold">Your Selling Price</label>
                      <input 
                        type="number" 
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-full border p-2 text-sm rounded mt-1 outline-none focus:border-[#0d2818]"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Your Profit:</span>
                      <span className={`font-bold ${currentProfit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ₦{currentProfit.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => savePrice(product.id, product.cost_price)}
                        disabled={saving}
                        className="flex-1 bg-[#0d2818] text-white py-2 text-xs rounded hover:opacity-90 flex justify-center items-center gap-2"
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        SAVE PRICE
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-3 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Selling At</p>
                      {hasMarkup ? (
                        <p className="text-lg font-bold text-[#0d2818]">
                          ₦{product.my_price.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-400">Not set</p>
                      )}
                      
                      {hasMarkup && (
                         <p className="text-xs text-green-600 font-medium">+ ₦{product.profit.toLocaleString()} Profit</p>
                      )}
                    </div>
                    <button 
                      onClick={() => startEditing(product)}
                      className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}