import { useState, useEffect } from 'react';
import { supabase, Product, Review } from '../../../lib/supabase';
import { Category } from './useSettings';

interface UseProductModalProps {
  product: Product | null;
  onSuccess: () => void;
}

export function useProductModal({ product, onSuccess }: UseProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    compare_at_price: '',
    wholesale_price: '',
    wholesale_min_qty: '7',
    dropship_price: '',
    stock: '',
    category: '',
    product_type: ''
  });

  const [images, setImages] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newType, setNewType] = useState('');
  const [newSize, setNewSize] = useState('');
  const [reviews, setReviews] = useState<Omit<Review, 'id' | 'created_at' | 'product_id'>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewer_name: '',
    rating: 5,
    comment: ''
  });

  // Fetch categories + item types on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (cats && cats.length > 0) {
      const { data: itemTypes } = await supabase
        .from('category_item_types')
        .select('*')
        .order('sort_order', { ascending: true });

      const merged: Category[] = cats.map(cat => ({
        ...cat,
        item_types: (itemTypes || []).filter(it => it.category_id === cat.id)
      }));

      setCategories(merged);

      // Set defaults only if formData not yet populated (new product)
      if (!product) {
        const firstCat = merged[0];
        const firstType = firstCat?.item_types?.[0]?.slug || '';
        setFormData(prev => ({
          ...prev,
          category: firstCat?.slug || '',
          product_type: firstType
        }));
      }
    }

    setCategoriesLoading(false);
  };

  // Populate form when editing existing product
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
        dropship_price: String(product.dropship_price || ''),
        stock: String(product.stock),
        category: product.category,
        product_type: product.product_type || ''
      });
      setImages(product.images || [product.image_url]);
      setColorOptions(product.color_options || []);
      setTypeOptions(product.type_options || []);
    }
  }, [product]);

  // When category changes, reset product_type to first valid type for that category
  const handleCategoryChange = (newCategory: string) => {
    const cat = categories.find(c => c.slug === newCategory);
    const firstType = cat?.item_types?.[0]?.slug || '';
    setFormData(prev => ({ ...prev, category: newCategory, product_type: firstType }));
  };

  // Derived: item types for currently selected category
  const availableItemTypes = categories.find(c => c.slug === formData.category)?.item_types || [];

  // Compresses image to WebP, max 800px wide, iteratively reducing quality
  // until the file is at or under 65KB. Stops at quality 0.1 to avoid
  // making images unrecognisably bad on very large source files.
  const compressImage = (file: File, maxWidth = 800, targetSizeKB = 65): Promise<File> =>
    new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.75;
        const attempt = () => {
          canvas.toBlob(
            blob => {
              if (!blob) return resolve(new File([], file.name, { type: 'image/webp' }));
              if (blob.size / 1024 <= targetSizeKB || quality <= 0.1) {
                resolve(new File([blob], file.name, { type: 'image/webp' }));
              } else {
                quality -= 0.05;
                attempt();
              }
            },
            'image/webp',
            quality
          );
        };
        attempt();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

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

      const compressed = await compressImage(file);
      const fileName = `${Math.random()}.webp`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressed, { contentType: 'image/webp' });

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
    if (colorOptions.includes(newColor.trim())) { alert('This color already exists'); return; }
    setColorOptions([...colorOptions, newColor.trim()]);
    setNewColor('');
  };

  const removeColor = (color: string) => setColorOptions(colorOptions.filter(c => c !== color));

  const addType = () => {
    if (!newType.trim()) return;
    if (typeOptions.includes(newType.trim())) { alert('This type already exists'); return; }
    setTypeOptions([...typeOptions, newType.trim()]);
    setNewType('');
  };

  const removeType = (type: string) => setTypeOptions(typeOptions.filter(t => t !== type));

  const addSize = () => {
    if (!newSize.trim()) return;
    if (sizeOptions.includes(newSize.trim())) { alert('This size already exists'); return; }
    setSizeOptions([...sizeOptions, newSize.trim()]);
    setNewSize('');
  };

  const removeSize = (size: string) => setSizeOptions(sizeOptions.filter(s => s !== size));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert('Upload at least one image');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
      dropship_price: formData.dropship_price ? parseFloat(formData.dropship_price) : null,
      wholesale_min_qty: parseInt(formData.wholesale_min_qty) || 7,
      stock: parseInt(formData.stock),
      category: product?.category ?? formData.category,
      product_type: formData.product_type,
      images,
      color_options: colorOptions.length > 0 ? colorOptions : null,
      type_options: typeOptions.length > 0 ? typeOptions : null,
      is_active: true,
    };

    try {
      let productId = product?.id;

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);

        if (error) {
          console.error('Update failed:', error);
          alert(`Failed to update product: ${error.message}`);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error('Insert failed:', error);
          alert(`Failed to save product: ${error.message}`);
          return;
        }

        productId = data?.id;
      }

      if (reviews.length > 0 && productId) {
        const { error } = await supabase
          .from('reviews')
          .insert(reviews.map(r => ({ product_id: productId, ...r })));

        if (error) {
          // Non-fatal — product is saved, just warn
          console.error('Reviews insert failed:', error);
          alert('Product saved but reviews failed to save. You can add them later.');
        }
      }

      onSuccess();
    } finally {
      setSubmitting(false);
    }
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
    sizeOptions,
    newColor,
    setNewColor,
    newType,
    setNewType,
    newSize,
    setNewSize,
    reviews,
    uploading,
    submitting,
    newReview,
    setNewReview,
    handleImageUpload,
    addColor,
    removeColor,
    addType,
    removeType,
    addSize,
    removeSize,
    handleSubmit,
    addReview,
    // Category data for ProductBasicInfo
    categories,
    categoriesLoading,
    availableItemTypes,
    handleCategoryChange
  };
}
