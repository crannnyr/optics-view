import { Package } from 'lucide-react';

interface OrderItemRowProps {
  item: any;
}

export default function OrderItemRow({ item }: OrderItemRowProps) {
  const img = item.products?.images?.[0] || item.products?.image_url;
  return (
    <div className="flex gap-3">
      <div className="w-12 h-12 bg-gray-100 rounded border shrink-0 overflow-hidden">
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <Package size={14} className="m-auto mt-3 text-gray-300" />}
      </div>
      <div>
        <p className="text-sm font-medium">{item.products?.name}</p>
        <p className="text-xs text-gray-400">Qty: {item.quantity} · ₦{item.price?.toLocaleString()}</p>
        {(item.selected_color || item.selected_type) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.selected_color && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                {item.selected_color}
              </span>
            )}
            {item.selected_type && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                {item.selected_type}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
