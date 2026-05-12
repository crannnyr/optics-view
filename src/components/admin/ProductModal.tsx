import { X } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { useProductModal } from './hooks/useProductModal';

// Child Components
import ProductBasicInfo from './products/ProductBasicInfo';
import ProductPricing from './products/ProductPricing';
import ProductVariants from './products/ProductVariants';
import ProductImages from './products/ProductImages';
import ProductReviews from './products/ProductReviews';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product, onClose, onSuccess }: ProductModalProps) {
  const {
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
    addReview,
    categories,
    categoriesLoading,
    availableItemTypes,
    handleCategoryChange
  } = useProductModal({ product, onSuccess });

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
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <ProductBasicInfo
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              categoriesLoading={categoriesLoading}
              availableItemTypes={availableItemTypes}
              handleCategoryChange={handleCategoryChange}
            />

            <ProductPricing
              formData={formData}
              setFormData={setFormData}
            />

            <ProductVariants
              colorOptions={colorOptions}
              typeOptions={typeOptions}
              newColor={newColor}
              setNewColor={setNewColor}
              newType={newType}
              setNewType={setNewType}
              addColor={addColor}
              removeColor={removeColor}
              addType={addType}
              removeType={removeType}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <ProductImages
              images={images}
              setImages={setImages}
              uploading={uploading}
              handleImageUpload={handleImageUpload}
            />

            <ProductReviews
              reviews={reviews}
              newReview={newReview}
              setNewReview={setNewReview}
              addReview={addReview}
            />

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
