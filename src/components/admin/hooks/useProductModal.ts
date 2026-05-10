import { useState, useEffect } from 'react';
import { supabase, Product, Review } from '../../../lib/supabase';

interface UseProductModalProps {
  product: Product | null;
  onSuccess: () => void;
}

export function useProductModal({ product, onSuccess }: UseProductModalProps) {
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
    product_type: 'video'
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
        product_type: product.product_type || 'video'
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
      product_type: formData.product_type,
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

  return {
    formData,
    setFormData,
    images,
    setImages,
    colorOptions,
    typeOptions,
    newColor,
    setNewColor,
    newType,
    setNewType,
    reviews,
    uploading,
    newReview,
    setNewReview,
    handleImageUpload,
    addColor,
    removeColor,
    addType,
    removeType,
    handleSubmit,
    addReview
  };
}
