import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Loader2, AlertCircle, Check, X, Info } from 'lucide-react';

interface Props { profile: any; registration: any; }

export default function RetailerProductsTab({ profile, registration }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving]     = useState(false);

  const selectedCats: string[] = registration?.selected_categories ?? [];

  useEffect(() => { if (profile) fetchProducts(); }, [profile, registration]);

  const fetchProducts = async () => {
    if (!profile) return;
    setError(null);
    try {
      // Only fetch products in retailer's selected categories
      let query = supabase
        .from('products')
        .select('id, name, price, wholesale_price, dropship_price, image_url, images, category')
        .eq('is_active', true)
        .order('name');

      if (selectedCats.length > 0) {
        query = query.in('category', selectedCats);
      }

      const { data: allProducts, error: prodErr } = await query;
      if (prodErr) throw prodErr;

      const { data: myPrices } = await supabase
        .from('retailer_products')
        .select('product_id, custom_price')
        .eq('retailer_id', profile.id);

      const merged = (allProducts ?? []).map(p => {
        const custom   = myPrices?.find(mp => mp.product_id === p.id);
        const costPrice = p.dropship_price || p.wholesale_price || p.price;
        return {
          ...p,
          cost_price: costPrice,
          my_price:   custom?.custom_price ?? null,
          profit:     custom ? custom.custom_price - costPrice : 0,
        };
      });

      setProducts(merged);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const savePrice = async (productId: string, costPrice: number) => {
    setSaving(true);
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < costPrice) {
      alert(`Selling price must be at least ₦${costPrice.toLocaleString()} (your cost)`);
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('retailer_products')
      .upsert({ retailer_id: profile.id, product_id: productId, custom_price: newPrice },
               { onConflict: 'retailer_id,product_id' });
    if (!error) { setEditingId(null); fetchProducts(); }
    else alert('Failed to save price. Try again.');
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-xs text-gray-400">LOADING CATALOG...</div>;

  if (error) return (
    <div className="p-8 text-center text-red-600 text-sm bg-red-50 rounded-lg border border-red-200">
      {error}
      <button onClick={fetchProducts} className="block mt-2 underline mx-auto">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Showing products from your categories: <strong>{selectedCats.join(', ') || 'none'}</strong>.
          Set a selling price above your cost to add it to your store and start earning.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg text-gray-400">
          <p className="text-sm">No products in your categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const isEditing     = editingId === product.id;
            const hasPrice      = product.my_price !== null;
            const displayImage  = product.images?.[0] || product.image_url;
            const liveProfit    = isEditing
              ? (parseFloat(editPrice || '0') - product.cost_price)
              : product.profit;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-lg overflow-hidden transition-all ${
                  isEditing ? 'ring-2 ring-[#0d2818] border-transparent' : 'border-gray-200'
                }`}
              >
                <div className="flex p-4 gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                    {displayImage
                      ? <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your cost: <span className="font-medium">₦{product.cost_price.toLocaleString()}</span>
                    </p>
                    {!hasPrice && !isEditing && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Not in store
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 border-t">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        placeholder="Your selling price"
                        className="w-full border p-2 text-sm rounded outline-none focus:border-[#0d2818]"
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Profit:</span>
                        <span className={`font-bold ${liveProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ₦{liveProfit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => savePrice(product.id, product.cost_price)}
                          disabled={saving}
                          className="flex-1 bg-[#0d2818] text-white py-2 text-xs rounded flex items-center justify-center gap-1 hover:opacity-90"
                        >
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 border rounded hover:bg-gray-100">
                          <X size={13} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        {hasPrice ? (
                          <>
                            <p className="text-sm font-bold text-[#0d2818]">₦{product.my_price.toLocaleString()}</p>
                            <p className="text-xs text-green-600">+₦{product.profit.toLocaleString()} profit</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Price not set</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(product.id);
                          setEditPrice(product.my_price?.toString() || product.price.toString());
                        }}
                        className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200"
                      >
                        <Edit2 size={14} className="text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}