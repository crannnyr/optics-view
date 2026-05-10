import { Truck, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { NIGERIAN_STATES } from '../hooks/useSettings';

interface DeliverySettingsViewProps {
  getDeliveryFee: (state: string) => number;
  editingDelivery: string | null;
  setEditingDelivery: (state: string | null) => void;
  newDeliveryFee: Record<string, string>;
  setNewDeliveryFee: (fee: Record<string, string>) => void;
  handleUpdateDeliveryFee: (state: string) => void;
}

export default function DeliverySettingsView({
  getDeliveryFee,
  editingDelivery,
  setEditingDelivery,
  newDeliveryFee,
  setNewDeliveryFee,
  handleUpdateDeliveryFee
}: DeliverySettingsViewProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        <Truck size={24} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">State-Specific Delivery Fees</h2>
      </div>

      <div className="bg-white border rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NIGERIAN_STATES.map(state => {
            const currentFee = getDeliveryFee(state);
            const isEditing = editingDelivery === state;

            return (
              <div key={state} className="border p-4 rounded hover:border-[#0d2818] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="font-medium text-sm">{state}</span>
                </div>

                {isEditing ? (
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={newDeliveryFee[state] || ''}
                      onChange={(e) => setNewDeliveryFee({...newDeliveryFee, [state]: e.target.value})}
                      className="flex-1 border p-2 text-sm outline-none focus:border-[#0d2818]"
                    />
                    <button
                      onClick={() => handleUpdateDeliveryFee(state)}
                      className="bg-[#0d2818] text-white p-2 rounded hover:opacity-90"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingDelivery(null);
                        setNewDeliveryFee({});
                      }}
                      className="bg-gray-200 text-gray-600 p-2 rounded hover:bg-gray-300"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-mono text-lg text-[#0d2818]">
                      ₦{currentFee.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setEditingDelivery(state);
                        setNewDeliveryFee({[state]: currentFee.toString()});
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
