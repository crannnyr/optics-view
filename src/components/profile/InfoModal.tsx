import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface InfoModalProps {
  title: string;
  themeColor: string;
  onClose: () => void;
  children: ReactNode;
}

export default function InfoModal({ title, themeColor, onClose, children }: InfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2 sticky top-0 bg-white">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed space-y-3">
          {children}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-medium rounded-full border-2"
            style={{ borderColor: themeColor, color: themeColor }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
