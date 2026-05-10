import { useState, useEffect } from 'react';
import { supabase, Product, Review } from '../../lib/supabase';
import { X, Plus, Loader2, Trash2 } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product, onClose, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    compare_at_price: '',
    wholesale_price: '',
    wholesale_min_qty: '7',
    stock: '',
    category: 'eyewear',
    product_type: 'video'  // ADDED
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newType, setNewType] = useState('');
  const [reviews, setReviews] = useState<Omit<Review, 'id' | 'created_at' | 'product_id'>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewer_name: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: String(product.price),
        cost_price: String(product.cost_price || ''),
        compare_at_price: String(product.compare_at_price || ''),
        wholesale_price: String(product.wholesale_price || ''),
        wholesale_min_qty: String(product.wholesale_min_qty || '7'),
        stock: String(product.stock),
        category: product.category,
        product_type: product.product_type || 'video'  // ADDED
      });
      setImages(product.images || [product.image_url]);
      setColorOptions(product.color_options || []);
      setTypeOptions(product.type_options || []);
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (images.length >= 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    const files = Array.from(e.target.files);
    const newImageUrls: string[] = [];

    for (const file of files) {
      if (images.length + newImageUrls.length >= 5) break;
      
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (!error) {
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        newImageUrls.push(data.publicUrl);
      }
    }

    setImages([...images, ...newImageUrls]);
    setUploading(false);
  };

  const addColor = () => {
    if (!newColor.trim()) return;
    if (colorOptions.includes(newColor.trim())) {
      alert('This color already exists');
      return;
    }
    setColorOptions([...colorOptions, newColor.trim()]);
    setNewColor('');
  };

  const removeColor = (color: string) => {
    setColorOptions(colorOptions.filter(c => c !== color));
  };

  const addType = () => {
    if (!newType.trim()) return;
    if (typeOptions.includes(newType.trim())) {
      alert('This type already exists');
      return;
    }
    setTypeOptions([...typeOptions, newType.trim()]);
    setNewType('');
  };

  const removeType = (type: string) => {
    setTypeOptions(typeOptions.filter(t => t !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Upload at least one image');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
      wholesale_min_qty: parseInt(formData.wholesale_min_qty) || 7,
      stock: parseInt(formData.stock),
      category: formData.category,
      product_type: formData.product_type,  // ADDED
      images,
      color_options: colorOptions.length > 0 ? colorOptions : null,
      type_options: typeOptions.length > 0 ? typeOptions : null
    };

    let productId = product?.id;

    if (product) {
      await supabase.from('products').update(payload).eq('id', product.id);
    } else {
      const { data } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();
      productId = data?.id;
    }

    if (reviews.length > 0 && productId) {
      await supabase
        .from('reviews')
        .insert(reviews.map(r => ({ product_id: productId, ...r })));
    }

    onSuccess();
  };

  const addReview = () => {
    if (!newReview.reviewer_name) return;

    setReviews([...reviews, newReview]);
    setNewReview({ reviewer_name: '', rating: 5, comment: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-light mb-6 text-[#0d2818] tracking-wide">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LEFT: TEXT INPUTS */}
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

            {/* PRICING */}
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

            {/* PRODUCT TYPE - NEW */}
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

            {/* VARIANT OPTIONS */}
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
          </div>

          {/* RIGHT: IMAGES & REVIEWS */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-2">
                Product Images (Max 5)
              </label>
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 border border-gray-200">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 p-1 rounded-full shadow-sm hover:bg-red-50"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0d2818] transition-colors text-gray-400 hover:text-[#0d2818]">
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                      multiple
                    />
                    {uploading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24}/>}
                    <span className="text-[10px] mt-1">Upload</span>
                  </label>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{images.length}/5 images</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-3 text-[#0d2818]">Manual Reviews</h3>
              <div className="bg-gray-50 p-4 space-y-3 rounded border border-gray-100">
                <input
                  placeholder="Reviewer Name"
                  className="w-full border p-2 text-xs focus:border-[#0d2818] outline-none bg-white"
                  value={newReview.reviewer_name}
                  onChange={e => setNewReview({...newReview, reviewer_name: e.target.value})}
                />
                <textarea
                  placeholder="Review Comment"
                  className="w-full border p-2 text-xs focus:border-[#0d2818] outline-none bg-white"
                  value={newReview.comment}
                  onChange={e => setNewReview({...newReview, comment: e.target.value})}
                />
                <button
                  type="button"
                  onClick={addReview}
                  className="w-full text-xs bg-white border border-gray-300 py-2 hover:bg-gray-100 uppercase tracking-wider"
                >
                  Add Review
                </button>
                
                <div className="max-h-32 overflow-y-auto space-y-2 pt-2">
                  {reviews.map((r, i) => (
                    <div key={i} className="text-[10px] text-gray-500 bg-white p-2 border border-gray-100">
                      <span className="font-bold text-gray-700">{r.reviewer_name}</span>: {r.comment.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0d2818] text-white py-4 text-xs tracking-[0.2em] font-medium hover:bg-opacity-90 shadow-lg mt-auto"
            >
              SAVE PRODUCT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}